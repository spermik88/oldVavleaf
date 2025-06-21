/*
 * Реализация провайдера LeafAnalyzer и классов анализа.
 * Использует OpenCVWorker для обработки изображений через WebView.
 * Позволяет вычислять площадь и находить контур листа.
 */
export interface LeafAnalyzer {
  analyzeArea(imageUri: string | null, isLivePreview: boolean): Promise<number>;
  findContour(imageUri: string | null): Promise<{ x: number; y: number }[]>;
}

export type Point = { x: number; y: number };

import * as FileSystem from "expo-file-system";
import { Image, Alert, ActivityIndicator, View, Text, StyleSheet } from "react-native";
import OpenCVWorker, { OpenCVHandle } from "@/components/OpenCVWorker";
import { analyzeLeafArea, findLeafContour } from "@/utils/camera-utils";
import React, { createContext, useContext, useRef, useState, useEffect } from "react";
import Colors from "@/constants/colors";
import { Platform } from "react-native";

const MAX_ATTEMPTS = 5;

type QueueItem = {
  resolve: (
    res: {
      area: number;
      contour: Point[];
      contourCount: number;
      markerFound: boolean;
    }
  ) => void;
  imageUri: string;
  base64: string;
  width: number;
  height: number;
  attempts: number;
  isLive: boolean;
  type: "area" | "contour";
};

const dummyAnalyzer: LeafAnalyzer = {
  analyzeArea: async () => {
    throw new Error('Analyzer not initialized');
  },
  findContour: async () => {
    throw new Error('Analyzer not initialized');
  },
};

export class OpenCvAnalyzer implements LeafAnalyzer {
  private static readonly MAX_QUEUE_SIZE = 3;
  private ready = false;
  private queue: QueueItem[] = [];
  constructor(private webRef: React.RefObject<OpenCVHandle | null>) {}

  private async sendImage(base64: string, width: number, height: number) {
    await this.webRef.current?.waitUntilReady();
    this.webRef.current?.sendImage(base64, width, height, 30);
  }

  setReady(value: boolean) {
    this.ready = value;
    if (this.ready && this.queue.length > 0) {
      const item = this.queue[0];
      void this.sendImage(item.base64, item.width, item.height);
    }
  }

  handleResult(res: {
    area: number;
    pxPerCell: number;
    contour: Point[];
    contourCount: number;
    markerFound: boolean;
  }) {
    const item = this.queue.shift();
    const cm2 =
      (res.area * (25.0 / (res.pxPerCell * res.pxPerCell))) / 100.0;
    item?.resolve({
      area: cm2,
      contour: res.contour,
      contourCount: res.contourCount,
      markerFound: res.markerFound,
    });
    if (this.queue.length > 0) {
      const next = this.queue[0];
      void this.sendImage(next.base64, next.width, next.height);
    }
  }

  async handleError(message: string) {
    const item = this.queue[0];
    if (!item) return;
    console.error(`OpenCV error: ${message}`);
    if (message === 'Marker not found') {
      this.queue.shift();
      Alert.alert('Ошибка OpenCV', 'Не найден маркер масштаба');
      item.resolve({ area: NaN, contour: [], contourCount: 0, markerFound: false });
      if (this.queue.length > 0) {
        const next = this.queue[0];
        void this.sendImage(next.base64, next.width, next.height);
      }
      return;
    }
    item.attempts += 1;
    if (item.attempts < MAX_ATTEMPTS) {
      await this.sendImage(item.base64, item.width, item.height);
      return;
    }
    this.queue.shift();
    Alert.alert('Ошибка OpenCV', 'Не удалось обработать кадр');
    item.resolve({ area: NaN, contour: [], contourCount: 0, markerFound: false });
    if (this.queue.length > 0) {
      const next = this.queue[0];
      void this.sendImage(next.base64, next.width, next.height);
    }
  }

  clearQueue() {
    this.queue = [];
  }

  private async process(
    imageUri: string,
    isLive: boolean,
    type: "area" | "contour"
  ): Promise<{ area: number; contour: Point[]; contourCount: number; markerFound: boolean }> {
    if (this.queue.length >= OpenCvAnalyzer.MAX_QUEUE_SIZE) {
      return { area: NaN, contour: [], contourCount: 0, markerFound: false };
    }
    const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
    const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      Image.getSize(imageUri, (w, h) => resolve({ width: w, height: h }), reject);
    });

    return new Promise((resolve) => {
      const item: QueueItem = {
        resolve,
        imageUri,
        base64,
        width,
        height,
        attempts: 0,
        isLive,
        type,
      };
      this.queue.push(item);
      if (this.ready && this.queue.length === 1) {
        void this.sendImage(base64, width, height);
      }
    });
  }

  async analyzeArea(imageUri: string | null, _isLivePreview: boolean) {
    if (!imageUri) throw new Error('No image URI');
    const res = await this.process(imageUri, _isLivePreview, 'area');
    return res.area;
  }

  async findContour(imageUri: string | null) {
    if (!imageUri) throw new Error('No image URI');
    const res = await this.process(imageUri, false, 'contour');
    return res.contour;
  }
}

const LeafAnalyzerContext = createContext<LeafAnalyzer>(dummyAnalyzer);

export const LeafAnalyzerProvider = ({ children }: { children: React.ReactNode }) => {
  const webRef = useRef<OpenCVHandle>(null);
  const [analyzer, setAnalyzer] = useState<LeafAnalyzer>(
    () => new OpenCvAnalyzer(webRef)
  );

  useEffect(() => {
    return () => {
      if (analyzer instanceof OpenCvAnalyzer) {
        analyzer.clearQueue();
      }
    };
  }, [analyzer]);

  const [isOpenCvReady, setIsOpenCvReady] = useState(Platform.OS === "web");
  const [opencvError, setOpenCvError] = useState(false);

  useEffect(() => {
    if (analyzer instanceof OpenCvAnalyzer && !opencvError) {
      webRef.current?.waitUntilReady().then(() => {
        analyzer.setReady(true);
        setIsOpenCvReady(true);
      });
    }
  }, [analyzer, opencvError]);

  const onResult = (
    res: {
      area: number;
      pxPerCell: number;
      contour: Point[];
      contourCount: number;
      markerFound: boolean;
    }
  ) => {
    if (analyzer instanceof OpenCvAnalyzer) {
      analyzer.handleResult(res);
    }
  };


  const onError = (message: string) => {
    if (analyzer instanceof OpenCvAnalyzer) {
      if (!isOpenCvReady) {
        setOpenCvError(true);
        Alert.alert('Ошибка OpenCV', 'Не удалось загрузить библиотеку');
      } else {
        analyzer.handleError(message);
      }
    }
  };

  return (
    <LeafAnalyzerContext.Provider value={analyzer}>
      {children}
      {analyzer instanceof OpenCvAnalyzer && !isOpenCvReady && !opencvError && (
        <View style={styles.initOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={Colors.text.primary} />
          <Text style={styles.initText}>Инициализация…</Text>
        </View>
      )}
      {analyzer instanceof OpenCvAnalyzer && (
        <OpenCVWorker
          ref={webRef}
          onResult={onResult}
          onError={onError}
          debug={__DEV__}
        />
      )}
    </LeafAnalyzerContext.Provider>
  );
};

export const useLeafAnalyzer = () => useContext(LeafAnalyzerContext);

const styles = StyleSheet.create({
  initOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  initText: {
    marginTop: 8,
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
  },
});
