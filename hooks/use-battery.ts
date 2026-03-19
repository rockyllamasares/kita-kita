import * as Battery from "expo-battery";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

export type BatteryData = {
  level: number; // 0-1
  isLow: boolean;
  isCharging: boolean;
  state: "unknown" | "unplugged" | "charging" | "full";
};

export function useBattery() {
  const [battery, setBattery] = useState<BatteryData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  // Get current battery status
  const getBatteryStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (Platform.OS === "web") {
        // Web doesn't support battery status
        console.log("[useBattery] Battery API not available on web");
        setBattery(null);
        return;
      }

      const level = await Battery.getBatteryLevelAsync();
      const state = await Battery.getBatteryStateAsync();
      const isLowBattery = await Battery.isLowPowerModeEnabledAsync();

      const batteryStateMap: Record<number, BatteryData['state']> = {
        [Battery.BatteryState.UNKNOWN]: 'unknown',
        [Battery.BatteryState.UNPLUGGED]: 'unplugged',
        [Battery.BatteryState.CHARGING]: 'charging',
        [Battery.BatteryState.FULL]: 'full',
      };

      const batteryData: BatteryData = {
        level,
        isLow: isLowBattery,
        isCharging: state === Battery.BatteryState.CHARGING || state === Battery.BatteryState.FULL,
        state: batteryStateMap[state] || 'unknown',
      };

      setBattery(batteryData);
      return batteryData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("[useBattery] Error getting battery status:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to battery state changes
  useEffect(() => {
    if (Platform.OS === "web") return;

    // Get initial status
    getBatteryStatus();

    // Subscribe to state changes
    const subscription = Battery.addBatteryStateListener(async () => {
      await getBatteryStatus();
    });

    return () => {
      subscription.remove();
    };
  }, [getBatteryStatus]);

  return {
    battery,
    error,
    loading,
    getBatteryStatus,
  };
}
