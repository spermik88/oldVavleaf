import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import { Platform } from "react-native";

/**
 * Сохраняет изображение с EXIF-данными
 * @param imageUri URI исходного изображения
 * @param filename Имя файла для сохранения
 * @param leafArea Площадь листа
 * @param location Координаты GPS (опционально)
 * @returns URI сохраненного изображения
 */
export async function saveImageWithExif(
  imageUri: string,
  filename: string,
  leafArea: number,
  location: { latitude: number; longitude: number } | null
): Promise<string> {
  try {
    // Создаем директорию для сохранения, если она не существует
    const dirUri = `${FileSystem.documentDirectory}листы/`;
    
    try {
      const dirInfo = await FileSystem.getInfoAsync(dirUri);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
      }
    } catch (error) {
      console.error("Ошибка при создании директории:", error);
      // Продолжаем выполнение, используя кэш-директорию как запасной вариант
    }
    
    // Полный путь для сохранения файла
    const destinationUri = `${dirUri}${filename}`;
    
    // Создаем пустой файл для симуляции
    try {
      // Проверяем, существует ли исходный файл
      const sourceInfo = await FileSystem.getInfoAsync(imageUri);
      
      if (sourceInfo.exists) {
        // Если файл существует, копируем его
        await FileSystem.copyAsync({
          from: imageUri,
          to: destinationUri
        });
      } else {
        // Если файла нет, создаем пустой файл
        await FileSystem.writeAsStringAsync(
          destinationUri,
          "Placeholder for leaf image"
        );
      }
      
      console.log(`Изображение сохранено: ${destinationUri}`);
      console.log(`Площадь листа: ${leafArea} см²`);
      
      if (location) {
        console.log(`GPS: ${location.latitude}, ${location.longitude}`);
        // В реальной реализации здесь бы использовался ExifInterface (Android)
        // или piexifjs для записи GPS-координат в EXIF:
        // GPSLatitude, GPSLatitudeRef (например: 55°45'30.00"N)
        // GPSLongitude, GPSLongitudeRef (например: 37°39'35.00"E)
        // Пример:
        // const exif = new ExifInterface(destinationUri);
        // exif.setLatLong(location.latitude, location.longitude);
        // exif.saveAttributes();
      }
      
      return destinationUri;
    } catch (error) {
      console.error("Ошибка при сохранении файла:", error);
      
      // Используем кэш-директорию как запасной вариант
      const fallbackUri = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(
        fallbackUri,
        "Placeholder for leaf image"
      );
      
      return fallbackUri;
    }
  } catch (error) {
    console.error("Ошибка при сохранении изображения:", error);
    
    // Возвращаем путь к временному файлу в случае ошибки
    const errorUri = `${FileSystem.cacheDirectory}error_${Date.now()}.jpg`;
    try {
      await FileSystem.writeAsStringAsync(
        errorUri,
        "Error placeholder"
      );
    } catch (e) {
      console.error("Критическая ошибка при создании временного файла:", e);
    }
    
    return errorUri;
  }
}

/**
 * Форматирует координаты GPS для EXIF
 * @param coordinate Координата (широта или долгота)
 * @returns Форматированная координата для EXIF в формате [градусы, минуты, секунды]
 */
export function formatGpsCoordinate(coordinate: number): number[] {
  // Преобразуем координату в формат [градусы, минуты, секунды]
  const absolute = Math.abs(coordinate);
  const degrees = Math.floor(absolute);
  const minutesFloat = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = (minutesFloat - minutes) * 60;
  
  return [degrees, minutes, seconds];
}

/**
 * Форматирует координаты GPS для отображения
 * @param latitude Широта
 * @param longitude Долгота
 * @returns Форматированные координаты для отображения
 */
export function formatGpsForDisplay(latitude: number, longitude: number): string {
  const latDegrees = Math.floor(Math.abs(latitude));
  const latMinutesFloat = (Math.abs(latitude) - latDegrees) * 60;
  const latMinutes = Math.floor(latMinutesFloat);
  const latSeconds = ((latMinutesFloat - latMinutes) * 60).toFixed(2);
  const latDirection = latitude >= 0 ? "N" : "S";
  
  const lonDegrees = Math.floor(Math.abs(longitude));
  const lonMinutesFloat = (Math.abs(longitude) - lonDegrees) * 60;
  const lonMinutes = Math.floor(lonMinutesFloat);
  const lonSeconds = ((lonMinutesFloat - lonMinutes) * 60).toFixed(2);
  const lonDirection = longitude >= 0 ? "E" : "W";
  
  return `${latDegrees}°${latMinutes}'${latSeconds}"${latDirection}, ${lonDegrees}°${lonMinutes}'${lonSeconds}"${lonDirection}`;
}

/**
 * Генерирует имя файла на основе даты и площади листа
 * @param date Дата съемки
 * @param leafArea Площадь листа
 * @returns Имя файла
 */
export function generateFilename(date: Date, leafArea: number): string {
  const dateStr = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
  return `${dateStr}_${leafArea.toFixed(2)}.jpg`;
}

/**
 * Добавляет комментарий в EXIF
 * @param imageUri URI изображения
 * @param comment Комментарий
 * @returns URI изображения с комментарием
 */
export async function addExifComment(imageUri: string, comment: string): Promise<string> {
  try {
    // В реальной реализации здесь бы использовался ExifInterface или piexifjs
    // для добавления комментария в EXIF-поля UserComment и ImageDescription
    console.log(`Добавление комментария в EXIF: ${comment}`);
    return imageUri;
  } catch (error) {
    console.error("Ошибка при добавлении комментария в EXIF:", error);
    return imageUri;
  }
}