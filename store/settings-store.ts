import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SettingsStore {
  highResolutionCapture: boolean;
  saveGpsData: boolean;
  manualFocusOnly: boolean;
  
  toggleHighResolutionCapture: () => void;
  toggleSaveGpsData: () => void;
  toggleManualFocusOnly: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      highResolutionCapture: true,
      saveGpsData: true,
      manualFocusOnly: true,
      
      toggleHighResolutionCapture: () => 
        set((state) => ({ 
          highResolutionCapture: !state.highResolutionCapture 
        })),
      
      toggleSaveGpsData: () => 
        set((state) => ({ 
          saveGpsData: !state.saveGpsData 
        })),
      
      toggleManualFocusOnly: () => 
        set((state) => ({ 
          manualFocusOnly: !state.manualFocusOnly 
        })),
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);