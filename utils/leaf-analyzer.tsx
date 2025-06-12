export interface LeafAnalyzer {
  analyzeArea(imageUri: string | null, isLivePreview: boolean): Promise<number>;
  findContour(imageUri: string | null): Promise<{ x: number; y: number }[]>;
}

export type Point = { x: number; y: number };

import * as FileSystem from "expo-file-system";
import { Image } from "react-native";
import OpenCVWorker, { OpenCVHandle } from "@/components/OpenCVWorker";
import { analyzeLeafArea, findLeafContour } from "@/utils/camera-utils";
import React, { createContext, useContext, useMemo, useRef } from "react";
import { Platform } from "react-native";

export class FallbackAnalyzer implements LeafAnalyzer {
  analyzeArea(imageUri: string | null, isLivePreview: boolean) {
    return analyzeLeafArea(imageUri, isLivePreview);
  }
  findContour(imageUri: string | null) {
    return findLeafContour(imageUri);
  }
}

export class OpenCvAnalyzer implements LeafAnalyzer {
  private ready = false;
  private queue: ((res: { area: number; contour: Point[] }) => void)[] = [];
  constructor(private webRef: React.RefObject<OpenCVHandle>) {}

  setReady(value: boolean) {
    this.ready = value;
  }

  handleResult(res: { area: number; contour: Point[] }) {
    const cb = this.queue.shift();
    cb?.(res);
  }

  private async process(imageUri: string): Promise<{ area: number; contour: Point[] }> {
    const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
    const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      Image.getSize(imageUri, (w, h) => resolve({ width: w, height: h }), reject);
    });

    return new Promise((resolve) => {
      this.queue.push(resolve);
      if (this.ready) {
        this.webRef.current?.sendImage(base64, width, height, 30);
      }
    });
  }

  async analyzeArea(imageUri: string | null, _isLivePreview: boolean) {
    if (!imageUri) return analyzeLeafArea(null, _isLivePreview);
    const res = await this.process(imageUri);
    return res.area;
  }

  async findContour(imageUri: string | null) {
    if (!imageUri) return findLeafContour(null);
    const res = await this.process(imageUri);
    return res.contour;
  }
}

const LeafAnalyzerContext = createContext<LeafAnalyzer>(new FallbackAnalyzer());

export const LeafAnalyzerProvider = ({ children }: { children: React.ReactNode }) => {
  const webRef = useRef<OpenCVHandle>(null);
  const analyzer = useMemo<LeafAnalyzer>(() => {
    if (Platform.OS === "web") {
      return new FallbackAnalyzer();
    }
    return new OpenCvAnalyzer(webRef);
  }, []);

  const onResult = (res: { area: number; contour: Point[] }) => {
    if (analyzer instanceof OpenCvAnalyzer) {
      analyzer.handleResult(res);
    }
  };

  const onReady = () => {
    if (analyzer instanceof OpenCvAnalyzer) {
      analyzer.setReady(true);
    }
  };

  return (
    <LeafAnalyzerContext.Provider value={analyzer}>
      {children}
      {analyzer instanceof OpenCvAnalyzer && (
        <OpenCVWorker ref={webRef} onResult={onResult} onReady={onReady} />
      )}
    </LeafAnalyzerContext.Provider>
  );
};

export const useLeafAnalyzer = () => useContext(LeafAnalyzerContext);
