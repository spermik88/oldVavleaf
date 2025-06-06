import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface LeafImage {
  id: string;
  uri: string;
  filename: string;
  date: string;
  leafArea: number;
  location: {
    latitude: number;
    longitude: number;
  } | null;
}

interface LeafStore {
  capturedImages: LeafImage[];
  addCapturedImage: (image: LeafImage) => void;
  removeCapturedImage: (id: string) => void;
  clearAllImages: () => void;
  setCapturedImages: (images: LeafImage[]) => void;
}

export const useLeafStore = create<LeafStore>()(
  persist(
    (set) => ({
      capturedImages: [],
      
      addCapturedImage: (image) => 
        set((state) => ({
          capturedImages: [image, ...state.capturedImages]
        })),
      
      removeCapturedImage: (id) => 
        set((state) => ({
          capturedImages: state.capturedImages.filter(img => img.id !== id)
        })),
      
      clearAllImages: () => 
        set({ capturedImages: [] }),
        
      setCapturedImages: (images) => 
        set({ capturedImages: images }),
    }),
    {
      name: "leaf-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);