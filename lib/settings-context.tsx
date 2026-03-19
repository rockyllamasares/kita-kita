import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

export type LocationUpdateInterval = "5s" | "10s" | "30s" | "1min";

const STORAGE_KEY = "kita_kita_settings";

export type LocationSettings = {
  foregroundTracking: boolean;
  backgroundTracking: boolean;
  updateFrequency: LocationUpdateInterval;
  batterySaverMode: boolean;
  notificationsEnabled: boolean;
  privateMode: boolean;
};

const DEFAULT_SETTINGS: LocationSettings = {
  foregroundTracking: true,
  backgroundTracking: false,
  updateFrequency: "30s",
  batterySaverMode: false,
  notificationsEnabled: true,
  privateMode: false,
};

type SettingsContextType = {
  settings: LocationSettings;
  updateSettings: (partial: Partial<LocationSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  isLoading: boolean;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<LocationSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from storage on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as LocationSettings;
        setSettings(parsed);
        console.log("[Settings] Loaded settings:", parsed);
      } else {
        console.log("[Settings] No stored settings, using defaults");
      }
    } catch (err) {
      console.error("[Settings] Error loading settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (partial: Partial<LocationSettings>) => {
    try {
      const updated = { ...settings, ...partial };
      setSettings(updated);

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      console.log("[Settings] Updated settings:", partial);
    } catch (err) {
      console.error("[Settings] Error updating settings:", err);
      throw err;
    }
  };

  const resetSettings = async () => {
    try {
      setSettings(DEFAULT_SETTINGS);
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log("[Settings] Reset to defaults");
    } catch (err) {
      console.error("[Settings] Error resetting settings:", err);
      throw err;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useLocationSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useLocationSettings must be used within SettingsProvider");
  }
  return context;
}
