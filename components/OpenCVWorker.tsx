// @ts-nocheck
import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { WebView } from 'react-native-webview';
import { View } from 'react-native';

export type OpenCVHandle = {
  sendImage: (base64: string, width: number, height: number, pxPerCell: number) => void;
};

type Props = {
  onResult?: (result: { area: number; contour: { x: number; y: number }[] }) => void;
};

const OpenCVWorker = forwardRef((props: Props, ref) => {
  const webViewRef = useRef<WebView>(null);
  const readyRef = useRef(false);
  const queueRef = useRef<
    { base64: string; width: number; height: number; pxPerCell: number }[]
  >([]);

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
    sendImage(base64, width, height, pxPerCell) {
      if (readyRef.current) {
        injectProcessImage(base64, width, height, pxPerCell);
      } else {
        queueRef.current.push({ base64, width, height, pxPerCell });
      }
    }
  }));

  const handleMessage = (event: any) => {
    const message = event.nativeEvent.data;

    if (message === 'ready') {
      readyRef.current = true;
      queueRef.current.forEach((item) =>
        injectProcessImage(item.base64, item.width, item.height, item.pxPerCell)
      );
      queueRef.current = [];
      return;
    }

    try {
      const data = JSON.parse(message);
      if (data.type === 'result') {
        props.onResult?.({ area: data.area, contour: data.contour });
      }
    } catch (error) {
      console.error('Ошибка WebView:', error);
    }
  };

  return (
    <View style={{ width: 1, height: 1, opacity: 0 }}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={require('../assets/opencv.html')}
        onMessage={handleMessage}
        javaScriptEnabled={true}
      />
    </View>
  );
});

export default OpenCVWorker as React.ForwardRefExoticComponent<
  Props & React.RefAttributes<OpenCVHandle>
>;
