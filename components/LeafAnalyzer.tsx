// @ts-nocheck
// components/LeafAnalyzer.tsx
import React, { useRef, useState } from 'react';
import { View, Button, Text } from 'react-native';
import { WebView } from 'react-native-webview';

export default function LeafAnalyzer() {
  const webViewRef = useRef(null);
  const [area, setArea] = useState(null);
  const [ready, setReady] = useState(false);
  const debug = __DEV__;

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'ready') {
        console.log('OpenCV готов');
        setReady(true);
      } else if (data.type === 'result') {
        console.log('Результат получен:', data.area);
        setArea(data.area);
      } else if (data.type === 'error') {
        console.error('Ошибка внутри WebView:', data.message);
      }
    } catch (e) {
      console.error('Ошибка парсинга:', e);
    }
  };

  const sendImage = () => {
    const base64Image = '...'; // Вставь строку base64 изображения
    const width = 720;
    const height = 1280;
    const pxPerCell = 30;

    webViewRef.current?.injectJavaScript(`
      window.processImage(${JSON.stringify(base64Image)}, ${width}, ${height}, ${pxPerCell});
      true;
    `);
  };

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webViewRef}
        source={{ uri: `http://localhost:8081/opencv.html${debug ? '?debug=true' : ''}` }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        originWhitelist={['*']}
        allowFileAccess
        style={{ flex: 1 }}
      />
      <Button title="Отправить изображение" onPress={sendImage} disabled={!ready} />
      {area !== null && <Text>Площадь: {area} см²</Text>}
    </View>
  );
}
