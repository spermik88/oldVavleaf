/*
 * Экран камеры и основной логики измерения.
 * Использует CameraView, LeafContour и утилиты анализа.
 * Обрабатывает съемку, расчет площади и сохранение снимков.
 */
import LeafContour from "@/components/LeafContour";
import { useLeafAnalyzer } from "@/utils/leaf-analyzer";

import React, { useState, useRef, useEffect } from "react";
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions, 
  Platform,
  Alert,
  BackHandler,
  Animated,
  Pressable
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { Settings, Image as ImageIcon, Camera, RefreshCw, MapPin } from "lucide-react-native";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import Slider from "@react-native-community/slider";
import Colors from "@/constants/colors";
import { useLeafStore } from "@/store/leaf-store";
import { useSettingsStore } from "@/store/settings-store";
import { saveImageWithExif } from "@/utils/image-utils";
import { useVolumeButtonListener } from "@/hooks/use-volume-button";

const { width, height } = Dimensions.get("window");

export default function CameraScreen() {
  const { analyzer, opencvError } = useLeafAnalyzer();
  const [permission, requestPermission] = useCameraPermissions();
  const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [focusDistance, setFocusDistance] = useState(0.5); // 0 to 1
  const [leafArea, setLeafArea] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [flashMode, setFlashMode] = useState<"off" | "on" | "auto">("off");
  const [captureAnimation] = useState(new Animated.Value(0));
  const [contourPoints, setContourPoints] = useState<{x: number, y: number}[]>([]);
  const [processingFrame, setProcessingFrame] = useState(false);
  const [showCaptureAnimation, setShowCaptureAnimation] = useState(false);
  const [slideToGalleryAnimation] = useState(new Animated.Value(0));
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const { capturedImages, addCapturedImage } = useLeafStore();
  const { highResolutionCapture, saveGpsData, manualFocusOnly } = useSettingsStore();

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
      if (result.canceled || !result.assets?.length) return;
      setIsCapturing(true);
      const uri = result.assets[0].uri;
      const now = new Date();
      const dateStr = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1)
        .toString()
        .padStart(2, '0')}.${now.getFullYear()}`;
      const area = await analyzer.analyzeArea(uri, false);
      const contour = await analyzer.findContour(uri);
      await handleOpenCVResult({ uri }, dateStr, area, contour);
    } catch (error) {
      console.error('Ошибка при выборе изображения:', error);
      Alert.alert('Ошибка', 'Не удалось обработать изображение');
      setIsCapturing(false);
    }
  };


  const handleOpenCVResult = async (
    photo: any,
    dateStr: string,
    area: number,
    contour?: any
  ) => {

    const filename = `${dateStr}_${area.toFixed(2)}.jpg`;

    const savedImageUri = await saveImageWithExif(
      photo.uri,
      filename,
      area,
      saveGpsData && location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      } : null
    );

    addCapturedImage({
      id: Date.now().toString(),
      uri: savedImageUri,
      filename,
      date: new Date().toISOString(),
      leafArea: area,
      location: saveGpsData && location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      } : null,
    });

    animateSlideToGallery();
    Alert.alert(
      "Фото сохранено",
      `Площадь листа: ${area.toFixed(2)} см²\nФайл: ${filename}`,
      [{ text: "OK" }]
    );

    setIsCapturing(false);
  };

  // Request permissions
  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
    
    if (!locationPermission) {
      requestLocationPermission();
    }
  }, [permission, locationPermission]);

  // Get location periodically
  useEffect(() => {
    if (!locationPermission?.granted || !saveGpsData) return;
    
    let locationSubscription: Location.LocationSubscription;
    
    (async () => {
      try {
        locationSubscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 5000 },
          (newLocation) => {
            setLocation(newLocation);
          }
        );
      } catch (error) {
        console.error("Error watching position:", error);
      }
    })();
    
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [locationPermission?.granted, saveGpsData]);

  // Handle volume button press for capture with debounce
  useVolumeButtonListener(() => {
    if (!isCapturing && cameraReady) {
      capturePhoto();
    }
  });

  // Live analysis of leaf area
useEffect(() => {
  let isMounted = true;

const captureAndSend = async () => {
  if (!cameraReady || isCapturing || !isMounted) return;
  if (processingFrame) return;
  try {
    setProcessingFrame(true);

    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.5,
      base64: true,
    });

    if (!photo?.base64 || !photo?.width || !photo?.height) return;

    const area = await analyzer.analyzeArea(photo.uri, true);
    const contour = await analyzer.findContour(photo.uri);
    setLeafArea(area);
    setContourPoints(contour);
  } catch (error) {
    console.error("Ошибка при анализе кадра:", error);
  } finally {
    if (isMounted) setProcessingFrame(false);
  }
};

  const timer = setInterval(captureAndSend, 1000);

  return () => {
  isMounted = false;
  clearInterval(timer);
};
}, [cameraReady, isCapturing, analyzer]);


  // Convert focus distance (0-1) to cm.mm format
  const formatFocusDistance = (value: number) => {
    // Map 0-1 to 5-50 cm range
    const distanceInCm = 5 + value * 45;
    return distanceInCm.toFixed(2).replace(".", ".");
  };

  const recalculateArea = async () => {
    console.log("Recalculating area...");
    setIsCalculating(true);
    
    try {
      const photo = await cameraRef.current?.takePictureAsync();
      if (!photo?.uri) throw new Error('No photo');
      const newArea = await analyzer.analyzeArea(photo.uri, false);
      const newContour = await analyzer.findContour(photo.uri);
      
      setLeafArea(newArea);
      setContourPoints(newContour);
      
      // Provide haptic feedback
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Ошибка при пересчете площади:", error);
      Alert.alert("Ошибка", "Не удалось пересчитать площадь листа");
    } finally {
      setIsCalculating(false);
    }
  };

  const animateCaptureEffect = () => {
    captureAnimation.setValue(0);
    setShowCaptureAnimation(true);
    Animated.sequence([
      Animated.timing(captureAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(captureAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(() => {
      setShowCaptureAnimation(false);
    });
  };

  const animateSlideToGallery = () => {
    // Создаем анимацию "улетания" в галерею
    slideToGalleryAnimation.setValue(0);
    Animated.timing(slideToGalleryAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true
    }).start();
  };

const capturePhoto = async () => {
  console.log("Capture photo called");
  if (!cameraReady || isCapturing) {
    console.log("Camera not ready or already capturing");
    return;
  }

  try {
    setIsCapturing(true);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    animateCaptureEffect();

    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()}`;
    if (!cameraRef.current) {
      setIsCapturing(false);
      return;
    }

    const photo = await cameraRef.current.takePictureAsync();
    if (!photo?.uri) {
      setIsCapturing(false);
      return;
    }
    const area = await analyzer.analyzeArea(photo.uri, false);
    const contour = await analyzer.findContour(photo.uri);
    await handleOpenCVResult(photo, dateStr, area, contour);
  } catch (error) {
    setIsCapturing(false);
    Alert.alert("Ошибка", "Не удалось сделать фото");
  }
};

  // Функция для навигации к настройкам
  const navigateToSettings = () => {
    console.log("Navigating to settings");
    router.push("/settings");
  };

  // Функция для навигации к галерее
  const navigateToGallery = () => {
    console.log("Navigating to gallery");
    router.push("/gallery");
  };

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Для работы приложения необходим доступ к камере
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Разрешить доступ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.permissionButton} onPress={pickImage}>
          <Text style={styles.permissionButtonText}>Выбрать изображение</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!locationPermission?.granted && saveGpsData) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Для сохранения GPS-координат необходим доступ к местоположению
        </Text>
        <TouchableOpacity 
          style={styles.permissionButton} 
          onPress={requestLocationPermission}
        >
          <Text style={styles.permissionButtonText}>Разрешить доступ</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Render a simplified view for web platform
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.webContainer}>
          <Text style={styles.webTitle}>Измерение площади листьев</Text>
          <Text style={styles.webDescription}>
            Эта функция доступна только в мобильном приложении.
            Пожалуйста, установите приложение на ваше устройство.
          </Text>

          <TouchableOpacity
            style={styles.permissionButton}
            onPress={pickImage}
          >
            <Text style={styles.permissionButtonText}>Выбрать изображение</Text>
          </TouchableOpacity>

          <View style={styles.webButtonsContainer}>
            <TouchableOpacity
              style={styles.webButton}
              onPress={navigateToSettings}
            >
              <Settings size={24} color={Colors.text.primary} />
              <Text style={styles.webButtonText}>Настройки</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.webButton}
              onPress={navigateToGallery}
            >
              <ImageIcon size={24} color={Colors.text.primary} />
              <Text style={styles.webButtonText}>Галерея</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        onCameraReady={() => {
          console.log("Camera ready");
          setCameraReady(true);
        }}
        onMountError={(error) => {
          console.error("Camera mount error:", error);
          Alert.alert("Ошибка камеры", "Не удалось инициализировать камеру");
        }}
      >
        {/* Capture flash effect */}
        {showCaptureAnimation && (
          <Animated.View 
            style={[
              styles.captureFlash,
              {
                opacity: captureAnimation
              }
            ]} 
          />
        )}
        
        {/* Slide to gallery animation */}
        <Animated.View
          style={[
            styles.slideToGallery,
            {
              opacity: slideToGalleryAnimation,
              transform: [
                {
                  translateX: slideToGalleryAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, width]
                  })
                },
                {
                  translateY: slideToGalleryAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -height / 2]
                  })
                },
                {
                  scale: slideToGalleryAnimation.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 0.8, 0.5]
                  })
                }
              ]
            }
          ]}
        >
          <View style={styles.slideToGalleryContent}>
            <Text style={styles.slideToGalleryText}>Сохранено в галерею</Text>
          </View>
        </Animated.View>
        
        {/* Leaf contour overlay */}
        
         {contourPoints.length > 0 && (
  <LeafContour points={contourPoints} />
)}
        
        {/* Leaf area display */}
        <View style={styles.areaContainer} pointerEvents="box-none">
          <Text style={styles.areaText}>
            Площадь: <Text style={styles.areaValue}>{leafArea.toFixed(2)} см²</Text>
          </Text>
          <Pressable 
            style={styles.recalculateButton}
            onPress={recalculateArea}
            disabled={isCalculating}
          >
            <RefreshCw 
              size={16} 
              color={Colors.text.primary} 
              style={isCalculating ? (styles.rotating as any) : undefined} 
            />
          </Pressable>
        </View>
        
        {/* Focus distance slider */}
        {manualFocusOnly && (
          <View style={styles.focusSliderContainer} pointerEvents="box-none">
            <Text style={styles.focusText}>{formatFocusDistance(focusDistance)} см</Text>
            <Slider
              style={styles.focusSlider}
              value={focusDistance}
              onValueChange={(value) => {
                console.log("Focus changed:", value);
                setFocusDistance(value);
              }}
              minimumValue={0}
              maximumValue={1}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={Colors.text.secondary}
              thumbTintColor={Colors.primary}
            />
          </View>
        )}
        
        {/* Resolution indicator */}
        {highResolutionCapture && (
          <View style={styles.resolutionBadge} pointerEvents="none">
            <Text style={styles.resolutionText}>HD</Text>
          </View>
        )}
        
        {/* GPS indicator */}
        {saveGpsData && location && (
          <View style={styles.gpsBadge} pointerEvents="none">
            <MapPin size={12} color={Colors.text.primary} />
            <Text style={styles.gpsText}>GPS</Text>
          </View>
        )}
        
        {/* Bottom controls */}
        <View style={styles.controlsContainer} pointerEvents="box-none">
          <Pressable 
            style={styles.controlButton}
            onPress={() => {
              console.log("Settings button pressed");
              navigateToSettings();
            }}
            hitSlop={20}
          >
            <Settings size={28} color={Colors.text.primary} />
          </Pressable>
          
          <Pressable 
            style={styles.captureButton}
            onPress={() => {
              console.log("Capture button pressed");
              capturePhoto();
            }}
            disabled={isCapturing || !cameraReady}
            hitSlop={20}
          >
            <View style={[
              styles.captureButtonInner,
              isCapturing && styles.captureButtonInnerActive
            ]} />
          </Pressable>
          
          <Pressable 
            style={styles.controlButton}
            onPress={() => {
              console.log("Gallery button pressed");
              navigateToGallery();
            }}
            hitSlop={20}
          >
            <ImageIcon size={28} color={Colors.text.primary} />
          </Pressable>
        </View>
      </CameraView>
      {opencvError && (
        <View style={styles.errorBanner} pointerEvents="none">
          <Text style={styles.errorText}>OpenCV не инициализирован</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.dark,
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: Colors.background.dark,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionText: {
    color: Colors.text.primary,
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.status.error,
    paddingVertical: 10,
    alignItems: "center",
    zIndex: 30,
  },
  errorText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: "bold",
  },
  areaContainer: {
    position: "absolute",
    top: 50,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
  },
  areaText: {
    color: Colors.text.primary,
    fontSize: 18,
  },
  areaValue: {
    fontWeight: "bold",
    color: Colors.primary,
  },
  recalculateButton: {
    marginLeft: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  rotating: {
    transform: [{ rotate: "45deg" }],
  },
  focusSliderContainer: {
    position: "absolute",
    right: 20,
    top: 120,
    bottom: 120,
    width: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  focusText: {
    color: Colors.text.primary,
    fontSize: 14,
    marginBottom: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  focusSlider: {
    height: 200,
    width: 150,
    transform: [{ rotate: "-90deg" }],
  },
  resolutionBadge: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: Colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    zIndex: 5,
  },
  resolutionText: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: "bold",
  },
  gpsBadge: {
    position: "absolute",
    top: 90,
    right: 20,
    backgroundColor: Colors.secondary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 5,
  },
  gpsText: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
  },
  controlsContainer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.text.primary,
  },
  captureButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.text.primary,
  },
  captureButtonInnerActive: {
    backgroundColor: Colors.primary,
  },
  captureFlash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    zIndex: 20,
  },
  contourOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  contourBox: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    backgroundColor: "transparent",
  },
  slideToGallery: {
    position: "absolute",
    top: height / 2,
    left: width / 2 - 100,
    width: 200,
    height: 100,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 15,
  },
  slideToGalleryContent: {
    alignItems: "center",
  },
  slideToGalleryText: {
    color: Colors.text.primary,
    fontSize: 16,
    marginTop: 8,
  },
  // Web-specific styles
  webContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  webTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text.primary,
    marginBottom: 16,
  },
  webDescription: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: "center",
    marginBottom: 32,
    maxWidth: 400,
  },
  webButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    maxWidth: 400,
  },
  webButton: {
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    margin: 8,
    width: 150,
  },
  webButtonText: {
    color: Colors.text.primary,
    marginTop: 8,
    fontSize: 16,
  },
});