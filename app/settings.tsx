/*
 * Экран настроек приложения.
 * Управляет параметрами съемки и обработкой данных через zustand-хранилища.
 * Реализует экспорт, импорт и очистку истории.
 */
import React, { useState } from "react";
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Switch, 
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  Camera, 
  MapPin, 
  Save, 
  Sliders, 
  Trash2, 
  HelpCircle, 
  FileText, 
  Share2,
  Download,
  Upload
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useSettingsStore } from "@/store/settings-store";
import { useLeafStore } from "@/store/leaf-store";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { ensureImageDir } from "@/utils/image-utils";

export default function SettingsScreen() {
  const { 
    highResolutionCapture,
    saveGpsData,
    manualFocusOnly,
    toggleHighResolutionCapture,
    toggleSaveGpsData,
    toggleManualFocusOnly
  } = useSettingsStore();
  
  const { capturedImages, clearAllImages, setCapturedImages } = useLeafStore();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleClearAllData = () => {
    Alert.alert(
      "Удаление всех данных",
      "Вы уверены, что хотите удалить все сохраненные измерения? Это действие нельзя отменить.",
      [
        { text: "Отмена", style: "cancel" },
        { 
          text: "Удалить", 
          style: "destructive",
          onPress: async () => {
            try {
              // Удаляем все файлы
              const dirUri = await ensureImageDir();
              const dirInfo = await FileSystem.getInfoAsync(dirUri);
              
              if (dirInfo.exists) {
                await FileSystem.deleteAsync(dirUri, { idempotent: true });
              }
              
              // Очищаем хранилище
              clearAllImages();
              Alert.alert("Готово", "Все данные удалены");
            } catch (error) {
              console.error("Ошибка при удалении данных:", error);
              Alert.alert("Ошибка", "Не удалось удалить все данные");
            }
          }
        }
      ]
    );
  };

  const handleExportData = async () => {
    if (capturedImages.length === 0) {
      Alert.alert("Нет данных", "Нет данных для экспорта");
      return;
    }
    
    try {
      setIsExporting(true);
      
      // Создаем JSON с данными
      const exportData = {
        version: "1.0",
        date: new Date().toISOString(),
        images: capturedImages
      };
      
      // Сохраняем JSON в файл
      const exportFilename = `ЛистПро_экспорт_${new Date().toISOString().slice(0, 10)}.json`;
      const exportPath = `${FileSystem.cacheDirectory}${exportFilename}`;
      
      await FileSystem.writeAsStringAsync(
        exportPath,
        JSON.stringify(exportData, null, 2)
      );
      
      // Делимся файлом
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(exportPath, {
          mimeType: "application/json",
          dialogTitle: "Экспорт данных ЛистПро",
          UTI: "public.json"
        });
      } else {
        Alert.alert("Ошибка", "Функция поделиться недоступна на этом устройстве");
      }
    } catch (error) {
      console.error("Ошибка при экспорте данных:", error);
      Alert.alert("Ошибка", "Не удалось экспортировать данные");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async () => {
    try {
      setIsImporting(true);
      
      // Выбираем файл
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true
      });
      
      if (result.canceled) {
        return;
      }
      
      // Читаем содержимое файла
      const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const importedData = JSON.parse(fileContent);
      
      // Проверяем формат данных
      if (!importedData.images || !Array.isArray(importedData.images)) {
        throw new Error("Неверный формат данных");
      }
      
      const dirUri = await ensureImageDir();
      
      // Обновляем хранилище
      setCapturedImages(importedData.images);
      
      Alert.alert("Успех", `Импортировано ${importedData.images.length} измерений`);
    } catch (error) {
      console.error("Ошибка при импорте данных:", error);
      Alert.alert("Ошибка", "Не удалось импортировать данные. Проверьте формат файла.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleHelp = () => {
    Alert.alert(
      "Справка",
      "Как пользоваться приложением:\n\n" +
      "1. Наведите камеру на лист растения\n" +
      "2. Используйте ползунок справа для настройки фокуса\n" +
      "3. Нажмите на кнопку в центре для съемки\n" +
      "4. Просматривайте сохраненные измерения в Галерее\n\n" +
      "Для получения точных измерений держите камеру параллельно поверхности листа.\n\n" +
      "Съемка также может быть выполнена с помощью кнопки громкости (+) или Bluetooth-кнопки.",
      [{ text: "Понятно" }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Камера</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Camera size={20} color={Colors.primary} style={styles.settingIcon} />
              <Text style={styles.settingText}>Съемка в высоком разрешении</Text>
            </View>
            <Switch
              value={highResolutionCapture}
              onValueChange={toggleHighResolutionCapture}
              trackColor={{ false: "#444", true: Colors.primary }}
              thumbColor={highResolutionCapture ? "#fff" : "#f4f3f4"}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Sliders size={20} color={Colors.primary} style={styles.settingIcon} />
              <Text style={styles.settingText}>Только ручной фокус</Text>
            </View>
            <Switch
              value={manualFocusOnly}
              onValueChange={toggleManualFocusOnly}
              trackColor={{ false: "#444", true: Colors.primary }}
              thumbColor={manualFocusOnly ? "#fff" : "#f4f3f4"}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Сохранение</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <MapPin size={20} color={Colors.primary} style={styles.settingIcon} />
              <Text style={styles.settingText}>Сохранять GPS-координаты</Text>
            </View>
            <Switch
              value={saveGpsData}
              onValueChange={toggleSaveGpsData}
              trackColor={{ false: "#444", true: Colors.primary }}
              thumbColor={saveGpsData ? "#fff" : "#f4f3f4"}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Управление данными</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleExportData}
            disabled={isExporting || capturedImages.length === 0}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color={Colors.primary} style={styles.actionIcon} />
            ) : (
              <Upload size={20} color={Colors.primary} style={styles.actionIcon} />
            )}
            <Text style={styles.actionText}>
              {isExporting ? "Экспорт..." : "Экспортировать данные"}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleImportData}
            disabled={isImporting}
          >
            {isImporting ? (
              <ActivityIndicator size="small" color={Colors.primary} style={styles.actionIcon} />
            ) : (
              <Download size={20} color={Colors.primary} style={styles.actionIcon} />
            )}
            <Text style={styles.actionText}>
              {isImporting ? "Импорт..." : "Импортировать данные"}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleClearAllData}
            disabled={isExporting || isImporting || capturedImages.length === 0}
          >
            <Trash2 size={20} color={Colors.status.error} style={styles.actionIcon} />
            <Text style={[styles.actionText, styles.deleteText]}>Удалить все данные</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Поддержка</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleHelp}
          >
            <HelpCircle size={20} color={Colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionText}>Справка</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>О приложении</Text>
          <Text style={styles.infoText}>
            ЛистПро v1.0.0
          </Text>
          <Text style={styles.infoDescription}>
            Приложение для измерения площади листьев растений с помощью камеры.
            Позволяет делать снимки, автоматически рассчитывать площадь листа и сохранять результаты с GPS-координатами.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.dark,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text.primary,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingTextContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionIcon: {
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  deleteText: {
    color: Colors.status.error,
  },
  infoSection: {
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: Colors.primary,
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
});