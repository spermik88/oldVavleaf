import React, { useState } from "react";
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Dimensions,
  Alert,
  Share,
  Modal,
  Image,
  ActivityIndicator,
  Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MapPin, Calendar, Ruler, Trash2, Share2, X, Info, ExternalLink } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useLeafStore } from "@/store/leaf-store";
import { LeafImage } from "@/store/leaf-store";
import * as FileSystem from "expo-file-system";
import * as Linking from "expo-linking";

const { width } = Dimensions.get("window");
const COLUMN_COUNT = 2;
const ITEM_WIDTH = (width - 48) / COLUMN_COUNT;

export default function GalleryScreen() {
  const { capturedImages, removeCapturedImage } = useLeafStore();
  const [selectedImage, setSelectedImage] = useState<LeafImage | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
  };

  const handleShare = async (item: LeafImage) => {
    try {
      setLoading(true);
      
      // Проверяем существование файла
      const fileInfo = await FileSystem.getInfoAsync(item.uri);
      
      if (!fileInfo.exists) {
        throw new Error("Файл не найден");
      }
      
      await Share.share({
        title: "Данные измерения листа",
        message: `Дата: ${formatDate(item.date)}
Площадь листа: ${item.leafArea} см²${item.location ? `
Координаты: ${item.location.latitude.toFixed(6)}, ${item.location.longitude.toFixed(6)}` : ''}`,
        url: Platform.OS === 'web' ? undefined : item.uri
      });
    } catch (error) {
      console.error("Ошибка при попытке поделиться:", error);
      Alert.alert("Ошибка", "Не удалось поделиться данными");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (item: LeafImage) => {
    Alert.alert(
      "Удаление",
      "Вы уверены, что хотите удалить это изображение?",
      [
        { text: "Отмена", style: "cancel" },
        { 
          text: "Удалить", 
          style: "destructive",
          onPress: async () => {
            try {
              // Удаляем файл, если он существует
              const fileInfo = await FileSystem.getInfoAsync(item.uri);
              if (fileInfo.exists) {
                await FileSystem.deleteAsync(item.uri);
              }
              
              // Удаляем из хранилища
              removeCapturedImage(item.id);
            } catch (error) {
              console.error("Ошибка при удалении файла:", error);
              Alert.alert("Ошибка", "Не удалось удалить файл");
            }
          }
        }
      ]
    );
  };

  const showDetails = (item: LeafImage) => {
    setSelectedImage(item);
    setDetailsVisible(true);
  };

  const openMap = (latitude: number, longitude: number) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}`,
      web: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    });
    
    if (url) {
      Linking.openURL(url).catch(err => {
        console.error("Ошибка при открытии карты:", err);
        Alert.alert("Ошибка", "Не удалось открыть карту");
      });
    }
  };

  const renderItem = ({ item }: { item: LeafImage }) => (
    <TouchableOpacity 
      style={styles.imageItem}
      onPress={() => showDetails(item)}
    >
      <Image
        source={{ uri: item.uri }}
        style={styles.imagePreview}
      />
      
      <View style={styles.imageInfo}>
        <View style={styles.infoRow}>
          <Calendar size={14} color={Colors.text.secondary} />
          <Text style={styles.infoText}>{formatDate(item.date)}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ruler size={14} color={Colors.primary} />
          <Text style={styles.infoText}>{item.leafArea} см²</Text>
        </View>
        
        {item.location && (
          <View style={styles.infoRow}>
            <MapPin size={14} color={Colors.text.secondary} />
            <Text style={styles.infoText} numberOfLines={1}>
              {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleShare(item)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.text.primary} />
          ) : (
            <Share2 size={16} color={Colors.text.primary} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item)}
          disabled={loading}
        >
          <Trash2 size={16} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {capturedImages.length > 0 ? (
        <FlatList
          data={capturedImages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={COLUMN_COUNT}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Нет сохраненных изображений</Text>
          <Text style={styles.emptySubtext}>
            Сделайте фото листа, чтобы увидеть его здесь
          </Text>
        </View>
      )}
      
      {/* Details Modal */}
      <Modal
        visible={detailsVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDetailsVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Детали измерения</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setDetailsVisible(false)}
              >
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            {selectedImage && (
              <>
                <View style={styles.detailImageContainer}>
                  <Image
                    source={{ uri: selectedImage.uri }}
                    style={styles.detailImage}
                  />
                </View>
                
                <View style={styles.detailsSection}>
                  <View style={styles.detailRow}>
                    <Calendar size={20} color={Colors.primary} style={styles.detailIcon} />
                    <View>
                      <Text style={styles.detailLabel}>Дата измерения</Text>
                      <Text style={styles.detailValue}>{formatDate(selectedImage.date)}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Ruler size={20} color={Colors.primary} style={styles.detailIcon} />
                    <View>
                      <Text style={styles.detailLabel}>Площадь листа</Text>
                      <Text style={styles.detailValue}>{selectedImage.leafArea} см²</Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Info size={20} color={Colors.primary} style={styles.detailIcon} />
                    <View>
                      <Text style={styles.detailLabel}>Имя файла</Text>
                      <Text style={styles.detailValue}>{selectedImage.filename}</Text>
                    </View>
                  </View>
                  
                  {selectedImage.location && (
                    <View style={styles.detailRow}>
                      <MapPin size={20} color={Colors.primary} style={styles.detailIcon} />
                      <View style={styles.locationContainer}>
                        <Text style={styles.detailLabel}>GPS-координаты</Text>
                        <Text style={styles.detailValue}>
                          {selectedImage.location.latitude.toFixed(6)}, {selectedImage.location.longitude.toFixed(6)}
                        </Text>
                        <TouchableOpacity 
                          style={styles.mapLink}
                          onPress={() => openMap(selectedImage.location!.latitude, selectedImage.location!.longitude)}
                        >
                          <ExternalLink size={16} color={Colors.primary} />
                          <Text style={styles.mapLinkText}>Открыть на карте</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
                
                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.shareButton]}
                    onPress={() => {
                      handleShare(selectedImage);
                      setDetailsVisible(false);
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color={Colors.text.primary} />
                    ) : (
                      <>
                        <Share2 size={20} color={Colors.text.primary} />
                        <Text style={styles.buttonText}>Поделиться</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.deleteModalButton]}
                    onPress={() => {
                      setDetailsVisible(false);
                      setTimeout(() => handleDelete(selectedImage), 300);
                    }}
                    disabled={loading}
                  >
                    <Trash2 size={20} color={Colors.text.primary} />
                    <Text style={styles.buttonText}>Удалить</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.dark,
  },
  listContent: {
    padding: 16,
  },
  imageItem: {
    width: ITEM_WIDTH,
    marginBottom: 16,
    marginHorizontal: 8,
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    overflow: "hidden",
  },
  imagePreview: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
  },
  imageInfo: {
    padding: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  infoText: {
    color: Colors.text.secondary,
    fontSize: 12,
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.background.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: Colors.status.error + "40", // 40 is opacity
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: "80%",
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text.primary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  detailImageContainer: {
    padding: 16,
    alignItems: "center",
  },
  detailImage: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: 12,
  },
  detailsSection: {
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  detailIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  locationContainer: {
    flex: 1,
  },
  mapLink: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  mapLinkText: {
    color: Colors.primary,
    fontSize: 14,
    marginLeft: 6,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: Colors.background.surface,
  },
  shareButton: {
    backgroundColor: Colors.primary + "40", // 40 is opacity
  },
  deleteModalButton: {
    backgroundColor: Colors.status.error + "40", // 40 is opacity
  },
  buttonText: {
    color: Colors.text.primary,
    fontSize: 16,
    marginLeft: 8,
  },
});