/*
 * Вспомогательные функции работы с камерой и изображениями.
 * Поставляет базовые операции обработки без генерации случайных значений.
 */
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

/**
 * Анализирует изображение и вычисляет площадь листа
 * @param imageUri URI изображения для анализа (null недопустим и вызывает ошибку)
 * @param isLivePreview Флаг, указывающий на анализ в режиме превью
 * @returns Площадь листа в см²
 */
export async function analyzeLeafArea(imageUri: string | null, _isLivePreview: boolean): Promise<number> {
  if (!imageUri || Platform.OS === 'web') {
    throw new Error('analyzeLeafArea требует локальный URI изображения');
  }

  try {
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ grayscale: true } as any],
      { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
    );
    console.log(`Обработанное изображение: ${manipulatedImage.uri}`);
  } catch (error) {
    console.error('Ошибка при обработке изображения:', error);
    throw error;
  }

  // Реальная логика вычисления площади должна быть реализована через OpenCV
  // Если OpenCV недоступен, вызывающий код обработает ошибку
  return NaN;
}


/**
 * Находит контур листа на изображении
 * @param imageUri URI изображения (null недопустим и вызывает ошибку)
 * @returns Контур листа в формате массива точек
 */
export async function findLeafContour(imageUri: string | null): Promise<{x: number, y: number}[]> {
  if (!imageUri || Platform.OS === 'web') {
    throw new Error('findLeafContour требует локальный URI изображения');
  }

  // Здесь должна быть реализация поиска контура с помощью OpenCV
  return [];
}

/**
 * Преобразует изображение в градации серого
 * @param imageUri URI исходного изображения
 * @returns URI преобразованного изображения
 */
export async function convertToGrayscale(imageUri: string): Promise<string> {
  try {
    if (Platform.OS === 'web') {
      return imageUri;
    }
    
    // Используем expo-image-manipulator для преобразования в градации серого
    // В реальной реализации с OpenCV это был бы cv.cvtColor с COLOR_RGBA2GRAY
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ grayscale: true } as any],
      { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
    );
    
    return result.uri;
  } catch (error) {
    console.error("Ошибка при преобразовании в градации серого:", error);
    throw new Error("Не удалось преобразовать изображение в градации серого");
  }
}

/**
 * Рассчитывает площадь по контуру и масштабу
 * @param contour Контур листа
 * @param scale Масштаб (пикселей на см)
 * @returns Площадь в см²
 */
export function calculateAreaFromContour(
  contour: {x: number, y: number}[], 
  scale: number
): number {
  // В реальной реализации с OpenCV здесь использовался бы cv.contourArea
  // для точного расчета площади контура
  
  if (contour.length < 3) {
    return 0;
  }
  
  let area = 0;
  for (let i = 0; i < contour.length; i++) {
    const j = (i + 1) % contour.length;
    area += contour[i].x * contour[j].y;
    area -= contour[j].x * contour[i].y;
  }
  
  area = Math.abs(area) / 2;
  
  // Пересчет в см²
  return area / (scale * scale);
}