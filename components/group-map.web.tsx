import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";

export type GroupLocation = {
  id: string;
  userId: number;
  userName: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  batteryLevel?: number;
  isCharging?: boolean;
  lastUpdated?: Date;
};

type GroupMapProps = {
  userLocation?: { latitude: number; longitude: number; accuracy?: number };
  groupLocations: GroupLocation[];
  onMarkerPress?: (location: GroupLocation) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
};

export function GroupMap({
  userLocation,
  groupLocations,
  onMarkerPress,
  isLoading,
  onRefresh,
}: GroupMapProps) {
  const [selectedMarker, setSelectedMarker] = useState<GroupLocation | null>(null);

  return (
    <View className="flex-1 relative">
      <ScrollView className="flex-1 bg-surface">
        <View className="p-4 gap-4">
          {/* User's Location */}
          {userLocation && (
            <View className="bg-background border border-primary rounded-lg p-4">
              <View className="flex-row items-center gap-2 mb-3">
                <Text className="text-lg">📍</Text>
                <Text className="text-sm font-bold text-foreground flex-1">Your Location</Text>
                <Text className="text-xs text-muted">Blue</Text>
              </View>
              <View className="gap-2">
                <Text className="text-xs text-muted">Coordinates</Text>
                <Text className="text-sm font-mono text-foreground">
                  {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                </Text>
                {userLocation.accuracy && (
                  <>
                    <Text className="text-xs text-muted mt-2">GPS Accuracy</Text>
                    <Text className="text-sm text-foreground">±{userLocation.accuracy.toFixed(1)}m</Text>
                  </>
                )}
              </View>
            </View>
          )}

          {/* Group Members */}
          <View className="gap-2">
            <Text className="text-sm font-bold text-foreground">Group Members ({groupLocations.length})</Text>
            {groupLocations.length === 0 ? (
              <View className="bg-background border border-border rounded-lg p-4">
                <Text className="text-xs text-muted text-center">No members online</Text>
              </View>
            ) : (
              groupLocations.map((location) => (
                <TouchableOpacity
                  key={location.id}
                  onPress={() => {
                    setSelectedMarker(location);
                    onMarkerPress?.(location);
                  }}
                  className="bg-background border border-border rounded-lg p-4 active:bg-background/80"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-foreground">{location.userName}</Text>
                      <Text className="text-xs text-muted mt-1">
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </Text>
                      {location.accuracy && (
                        <Text className="text-xs text-muted mt-1">
                          Accuracy: ±{location.accuracy.toFixed(1)}m
                        </Text>
                      )}
                    </View>
                    <View className="items-end">
                      {location.batteryLevel !== undefined && (
                        <View className="flex-row items-center gap-2">
                          <Text className={`font-bold text-xs ${
                            location.batteryLevel > 50
                              ? "text-green-500"
                              : location.batteryLevel > 20
                                ? "text-yellow-500"
                                : "text-red-500"
                          }`}>
                            {location.batteryLevel}%
                          </Text>
                          {location.isCharging && <Text className="text-xs">🔌</Text>}
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Refresh Button */}
          <TouchableOpacity
            onPress={onRefresh}
            disabled={isLoading}
            className="bg-primary py-3 rounded-lg mt-4 disabled:opacity-50"
          >
            <Text className="text-center font-bold text-background">
              {isLoading ? "Refreshing..." : "🔄 Refresh Locations"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      {isLoading && (
        <View className="absolute inset-0 bg-black/20 flex justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      )}
    </View>
  );
}
