import React, { useRef, forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Colors from "@/constants/colors";
import { Asset } from 'expo-asset';

export type OpenCVHandle = {
  sendImage: (base64: string, width: number, height: number, pxPerCell: number) => void;
  waitUntilReady: () => Promise<void>;
};

type Props = {
  onResult?: (
    result: {
      area: number;
      pxPerCell: number;
      contour: { x: number; y: number }[];
      contourCount: number;
      markerFound: boolean;
    }
  ) => void;
  onReady?: () => void;
  onError?: (message: string) => void;
  debug?: boolean;
};

const OpenCVWorker = forwardRef((props: Props, ref) => {
  const webViewRef = useRef<WebView>(null);
  const readyRef = useRef(false);
  const [readyState, setReadyState] = useState(false);
  const readyResolveRef = useRef<() => void>();
  const readyPromiseRef = useRef<Promise<void>>(
    new Promise((resolve) => {
      readyResolveRef.current = resolve;
    })
  );
  const queueRef = useRef<
    { base64: string; width: number; height: number; pxPerCell: number }[]
  >([]);

  useEffect(() => {
    if (readyRef.current) {
      setReadyState(true);
    } else {
      readyPromiseRef.current.then(() => setReadyState(true));
    }
  }, []);

  const htmlUri = Asset.fromModule(require('../assets/opencv.html')).uri;

  const injectProcessImage = (
    base64: string,
    width: number,
    height: number,
    pxPerCell: number
  ) => {
    const js = `
        window.processImage(${JSON.stringify(base64)}, ${width}, ${height}, ${pxPerCell});
        true;
      `;
    webViewRef.current?.injectJavaScript(js);
  };

  useImperativeHandle(ref, () => ({
    sendImage(base64: string, width: number, height: number, pxPerCell: number) {
      if (readyRef.current) {
        injectProcessImage(base64, width, height, pxPerCell);
      } else {
        queueRef.current.push({ base64, width, height, pxPerCell });
      }
    },
    waitUntilReady() {
      return readyRef.current ? Promise.resolve() : readyPromiseRef.current;
    },
  }));

  const handleMessage = (event: WebViewMessageEvent) => {
    const message = event.nativeEvent.data;

    let parsed: any = null;
    try {
      parsed = JSON.parse(message);
    } catch (e) {
      // ignore parse errors, message might be plain string
    }

    if (parsed?.type === 'ready' || message === 'ready') {
      readyRef.current = true;
      readyResolveRef.current?.();
      setReadyState(true);
      queueRef.current.forEach((item) =>
        injectProcessImage(item.base64, item.width, item.height, item.pxPerCell)
      );
      queueRef.current = [];
      props.onReady?.();
      return;
    }

    if (parsed?.type === 'result') {
      props.onResult?.({
        area: parsed.area,
        pxPerCell: parsed.pxPerCell,
        contour: parsed.contour,
        contourCount: parsed.contourCount,
        markerFound: parsed.markerFound,
      });
      return;
    }

    if (parsed?.type === 'error') {
      console.error(`OpenCV error: ${parsed.message}`);
      props.onError?.(parsed.message);
      return;
    }

    if (parsed === null) {
      console.error('Ошибка WebView: неверный формат сообщения');
    }
  };

  return (
    <View style={styles.wrapper}>
      {!readyState && (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator size="large" color={Colors.text.primary} />
        </View>
      )}
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ uri: `${htmlUri}${props.debug ? '?debug=true' : ''}` }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        style={styles.webview}
      />
    </View>
  );
});

export default OpenCVWorker as React.ForwardRefExoticComponent<
  Props & React.RefAttributes<OpenCVHandle>
>;

const styles = StyleSheet.create({
  wrapper: {
    width: 1,
    height: 1,
    opacity: 0,
  },
  webview: {
    width: 1,
    height: 1,
    opacity: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10,
  },
});
