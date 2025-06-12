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

  useImperativeHandle(ref, () => ({
    sendImage(base64, width, height, pxPerCell) {
      const js = `
        window.processImage(${JSON.stringify(base64)}, ${width}, ${height}, ${pxPerCell});
        true;
      `;
      webViewRef.current?.injectJavaScript(js);
    }
  }));

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'result') {
        props.onResult?.({ area: data.area, contour: data.contour });
      }
    } catch (error) {
      console.error("Ошибка WebView:", error);
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
