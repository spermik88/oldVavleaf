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
  persist<LeafStore>(
    (set) => ({
      capturedImages: [],

      addCapturedImage: (image: LeafImage) =>
        set((state: LeafStore) => ({
          capturedImages: [image, ...state.capturedImages]
        })),

      removeCapturedImage: (id: string) =>
        set((state: LeafStore) => ({
          capturedImages: state.capturedImages.filter(img => img.id !== id)
        })),
      
      clearAllImages: () => 
        set({ capturedImages: [] }),
        
      setCapturedImages: (images: LeafImage[]) =>
        set({ capturedImages: images }),
    }),
    {
      name: "leaf-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);