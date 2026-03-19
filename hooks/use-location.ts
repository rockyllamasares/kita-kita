import * as Location from "expo-location";
import { useCallback, useState } from "react";

export type LocationData = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
};

type UseLocationOptions = {
  enableHighAccuracy?: boolean;
  timeout?: number;
};

export function useLocation(options?: UseLocationOptions) {
  const { enableHighAccuracy = true } = options ?? {};

  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Request permission if not already granted
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Location permission denied");
      }

      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: enableHighAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
      });

      const locationData: LocationData = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy ?? undefined,
        altitude: currentLocation.coords.altitude ?? undefined,
        heading: currentLocation.coords.heading ?? undefined,
        speed: currentLocation.coords.speed ?? undefined,
      };

      setLocation(locationData);
      return locationData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("[useLocation] Error getting location:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [enableHighAccuracy]);

  const watchLocation = useCallback(
    async (callback: (location: LocationData) => void) => {
      try {
        // Request permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          throw new Error("Location permission denied");
        }

        // Watch location
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: enableHighAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
            timeInterval: 1000, // Update at least every 1 second
            distanceInterval: 0, // Update for any distance change
          },
          (currentLocation: Location.LocationObject) => {
            const locationData: LocationData = {
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
              accuracy: currentLocation.coords.accuracy ?? undefined,
              altitude: currentLocation.coords.altitude ?? undefined,
              heading: currentLocation.coords.heading ?? undefined,
              speed: currentLocation.coords.speed ?? undefined,
            };
            setLocation(locationData);
            callback(locationData);
          },
        );

        return subscription;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        console.error("[useLocation] Error watching location:", error);
        throw error;
      }
    },
    [enableHighAccuracy],
  );

  return {
    location,
    error,
    loading,
    getCurrentLocation,
    watchLocation,
  };
}
