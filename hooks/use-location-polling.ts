import { useEffect, useRef, useState } from "react";
import { useLocation, type LocationData } from "./use-location";
import { useBattery } from "./use-battery";
import { trpc } from "@/lib/trpc";
import { useAuth } from "./use-auth";
import { useLocationSettings, type LocationUpdateInterval } from "@/lib/settings-context";

const INTERVAL_MAP: Record<LocationUpdateInterval, number> = {
  "5s": 5000,
  "10s": 10000,
  "30s": 30000,
  "1min": 60000,
};

type UseLocationPollingOptions = {
  enabled?: boolean;
  interval?: LocationUpdateInterval;
  groupId?: number;
};

export function useLocationPolling(options?: UseLocationPollingOptions) {
  const { enabled = false, interval = "30s", groupId } = options ?? {};

  const { user } = useAuth();
  const { getCurrentLocation } = useLocation();
  const { battery, getBatteryStatus } = useBattery();

  const [isPolling, setIsPolling] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const updateLocationMutation = trpc.locations.update.useMutation();

  // Single location update
  const updateLocation = async (location: LocationData, batteryLevel?: number) => {
    if (!user || !groupId) {
      console.log("[useLocationPolling] Missing user or groupId");
      return;
    }

    try {
      // Get current battery if not provided
      const currentBattery = batteryLevel ?? (await getBatteryStatus());
      const batteryLevelPercent = currentBattery
        ? Math.round((currentBattery as any).level * 100)
        : undefined;

      await updateLocationMutation.mutateAsync({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        groupId,
        batteryLevel: batteryLevelPercent,
        isCharging: battery?.isCharging,
      });

      setLastUpdated(new Date());
      console.log("[useLocationPolling] Location updated", {
        lat: location.latitude,
        lon: location.longitude,
        battery: batteryLevelPercent,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("[useLocationPolling] Error updating location:", error);
    }
  };

  // Start polling
  const startPolling = async () => {
    if (isPolling || !enabled || !user || !groupId) return;

    try {
      console.log("[useLocationPolling] Starting location polling with interval:", interval);
      setIsPolling(true);
      setError(null);

      // Update immediately
      const location = await getCurrentLocation();
      if (location) {
        await updateLocation(location);
      }

      // Determine actual polling interval based on battery
      let actualInterval = INTERVAL_MAP[interval];
      if (battery && battery.level < 0.2) {
        // Low battery: increase interval to 1min
        console.log("[useLocationPolling] Low battery detected, using 1min interval");
        actualInterval = INTERVAL_MAP["1min"];
      } else if (battery && battery.level < 0.5 && !battery.isCharging) {
        // Medium battery: use next interval up
        console.log("[useLocationPolling] Medium battery, increasing interval");
        const intervals = ["5s", "10s", "30s", "1min"] as const;
        const currentIndex = intervals.indexOf(interval);
        if (currentIndex < intervals.length - 1) {
          actualInterval = INTERVAL_MAP[intervals[currentIndex + 1]];
        }
      }

      // Set up polling interval
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const location = await getCurrentLocation();
          if (location) {
            await updateLocation(location);
          }
        } catch (err) {
          console.error("[useLocationPolling] Error in polling loop:", err);
        }
      }, actualInterval) as unknown as NodeJS.Timeout;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsPolling(false);
      console.error("[useLocationPolling] Error starting polling:", error);
    }
  };

  // Stop polling
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
    console.log("[useLocationPolling] Stopped location polling");
  };

  // Auto-start/stop based on enabled flag
  useEffect(() => {
    if (enabled && !isPolling) {
      startPolling();
    } else if (!enabled && isPolling) {
      stopPolling();
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [enabled, user, groupId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return {
    isPolling,
    lastUpdated,
    error,
    startPolling,
    stopPolling,
    updateLocation,
  };
}
