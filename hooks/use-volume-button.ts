import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';

/**
 * Хук для обработки нажатия кнопки громкости
 * @param callback Функция, которая будет вызвана при нажатии кнопки громкости
 */
export function useVolumeButtonListener(callback: () => void) {
  useEffect(() => {
    // Переменная для отслеживания времени последнего нажатия (для дебаунса)
    let lastPressTime = 0;
    const DEBOUNCE_TIME = 500; // 500 мс между нажатиями
    
    // Функция-обработчик с дебаунсом
    const handleVolumePress = () => {
      const currentTime = Date.now();
      if (currentTime - lastPressTime > DEBOUNCE_TIME) {
        lastPressTime = currentTime;
        callback();
      }
      return true; // Предотвращаем стандартное поведение
    };
    
    // Если доступен нативный модуль для кнопок громкости, используем его
    if (Platform.OS === 'android' && typeof global.VolumeButtonListener !== 'undefined') {
      // Добавляем слушатель для кнопки громкости +
      global.VolumeButtonListener?.addListener('volumeUp', handleVolumePress);
      
      // Очищаем слушатель при размонтировании компонента
      return () => {
        global.VolumeButtonListener?.removeListener('volumeUp', handleVolumePress);
      };
    } else if (Platform.OS === 'android') {
      // Для Android можно использовать BackHandler как заглушку
      // В реальном приложении здесь был бы код для обработки кнопки громкости (KEYCODE_VOLUME_UP)
      // и Bluetooth HID-устройств через нативный модуль (react-native-keyevent или собственный)
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        // Это не обрабатывает кнопку громкости, но в реальном приложении
        // здесь был бы код для обработки кнопки громкости
        return false;
      });
      
      return () => backHandler.remove();
    }
  }, [callback]);
}

/**
 * Создает нативный модуль для обработки кнопок громкости
 * Этот код должен быть добавлен в Android-проект
 */
/*
// VolumeButtonListenerModule.java
package com.yourapp.volumebuttonlistener;

import android.view.KeyEvent;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class VolumeButtonListenerModule extends ReactContextBaseJavaModule {
    private static ReactApplicationContext reactContext;
    private static final String MODULE_NAME = "VolumeButtonListener";
    
    public VolumeButtonListenerModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
    }
    
    @Override
    public String getName() {
        return MODULE_NAME;
    }
    
    // Метод для отправки события в JavaScript
    private static void sendEvent(String eventName) {
        if (reactContext == null) return;
        
        WritableMap params = Arguments.createMap();
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
    }
    
    // Метод для обработки нажатия кнопки
    public static boolean handleKeyEvent(KeyEvent event) {
        int keyCode = event.getKeyCode();
        int action = event.getAction();
        
        // Обрабатываем только нажатие кнопки (ACTION_DOWN)
        if (action == KeyEvent.ACTION_DOWN) {
            switch (keyCode) {
                case KeyEvent.KEYCODE_VOLUME_UP:
                    sendEvent("volumeUp");
                    return true;
                case KeyEvent.KEYCODE_VOLUME_DOWN:
                    sendEvent("volumeDown");
                    return true;
            }
        }
        
        return false;
    }
    
    @ReactMethod
    public void addListener(String eventName) {
        // Метод для регистрации слушателя в JavaScript
    }
    
    @ReactMethod
    public void removeListener(String eventName) {
        // Метод для удаления слушателя в JavaScript
    }
}

// MainActivity.java (добавить в существующий класс)
@Override
public boolean dispatchKeyEvent(KeyEvent event) {
    if (VolumeButtonListenerModule.handleKeyEvent(event)) {
        return true;
    }
    return super.dispatchKeyEvent(event);
}
*/