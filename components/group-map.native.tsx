import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Modal } from "react-native";
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from "react-native-maps";

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
  const mapRef = useRef<MapView>(null);
  const [selectedMarker, setSelectedMarker] = useState<GroupLocation | null>(null);
  const [centerOnUser, setCenterOnUser] = useState(true);

  // Auto-center map on user location when it updates
  useEffect(() => {
    if (centerOnUser && userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        300
      );
    }
  }, [userLocation, centerOnUser]);

  // Auto-fit all markers
  const fitAllMarkers = () => {
    if (!mapRef.current || groupLocations.length === 0) return;

    const coordinates = [
      ...(userLocation ? [userLocation] : []),
      ...groupLocations.map((loc) => ({ latitude: loc.latitude, longitude: loc.longitude })),
    ];

    if (coordinates.length === 0) return;

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
      animated: true,
    });
  };

  const getBatteryColor = (batteryLevel?: number) => {
    if (!batteryLevel) return "#9CA3AF"; // gray
    if (batteryLevel > 50) return "#22C55E"; // green
    if (batteryLevel > 20) return "#EAB308"; // yellow
    return "#EF4444"; // red
  };

  return (
    <View className="flex-1 relative">
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: userLocation?.latitude ?? 14.5994,
          longitude: userLocation?.longitude ?? 120.9842,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        onRegionChangeComplete={() => setCenterOnUser(false)}
      >
        {/* User's Own Location */}
        {userLocation && (
          <>
            {/* Accuracy Circle */}
            {userLocation.accuracy && (
              <Circle
                center={{
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                }}
                radius={userLocation.accuracy}
                fillColor="rgba(59, 130, 246, 0.1)"
                strokeColor="rgba(59, 130, 246, 0.5)"
                strokeWidth={2}
              />
            )}

            {/* User Marker */}
            <Marker
              coordinate={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
              title="My Location"
              pinColor="#3B82F6"
              onPress={() => setSelectedMarker(null)}
            />
          </>
        )}

        {/* Group Members Markers */}
        {groupLocations.map((location) => (
          <React.Fragment key={location.id}>
            {/* Accuracy Circle */}
            {location.accuracy && (
              <Circle
                center={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                radius={location.accuracy}
                fillColor="rgba(168, 85, 247, 0.05)"
                strokeColor="rgba(168, 85, 247, 0.2)"
                strokeWidth={1}
              />
            )}

            {/* Member Marker */}
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title={location.userName}
              description={`Battery: ${location.batteryLevel}%`}
              pinColor={getBatteryColor(location.batteryLevel)}
              onPress={() => {
                setSelectedMarker(location);
                onMarkerPress?.(location);
              }}
            />
          </React.Fragment>
        ))}
      </MapView>

      {/* Loading Overlay */}
      {isLoading && (
        <View className="absolute inset-0 bg-black/20 flex justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      )}

      {/* Controls */}
      <View className="absolute bottom-6 right-6 gap-3">
        {/* Center on User Button */}
        <TouchableOpacity
          onPress={() => {
            setCenterOnUser(true);
            if (userLocation && mapRef.current) {
              mapRef.current.animateToRegion(
                {
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                },
                300
              );
            }
          }}
          className="bg-white rounded-full p-3 shadow-lg border border-gray-200"
        >
          <Text className="text-xl">📍</Text>
        </TouchableOpacity>

        {/* Fit All Markers Button */}
        {groupLocations.length > 0 && (
          <TouchableOpacity
            onPress={fitAllMarkers}
            className="bg-white rounded-full p-3 shadow-lg border border-gray-200"
          >
            <Text className="text-xl">🎯</Text>
          </TouchableOpacity>
        )}

        {/* Refresh Button */}
        <TouchableOpacity
          onPress={onRefresh}
          disabled={isLoading}
          className="bg-primary rounded-full p-3 shadow-lg disabled:opacity-50"
        >
          <Text className="text-xl">{isLoading ? "⏳" : "🔄"}</Text>
        </TouchableOpacity>
      </View>

      {/* Selected Marker Details Modal */}
      {selectedMarker && (
        <Modal transparent animationType="slide">
          <View className="flex-1 bg-black/50 flex justify-end">
            <View className="bg-surface rounded-t-2xl p-6 gap-4">
              {/* Header */}
              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-bold text-foreground">
                  {selectedMarker.userName}
                </Text>
                <TouchableOpacity onPress={() => setSelectedMarker(null)}>
                  <Text className="text-2xl">✕</Text>
                </TouchableOpacity>
              </View>

              {/* Details */}
              <View className="gap-3">
                {/* Location */}
                <View className="bg-background p-3 rounded-lg">
                  <Text className="text-xs text-muted mb-1">Location</Text>
                  <Text className="text-sm font-mono text-foreground">
                    {selectedMarker.latitude.toFixed(6)}, {selectedMarker.longitude.toFixed(6)}
                  </Text>
                </View>

                {/* Battery */}
                {selectedMarker.batteryLevel !== undefined && (
                  <View className="bg-background p-3 rounded-lg">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-xs text-muted">Battery</Text>
                      <Text
                        className={`font-bold text-sm ${
                          selectedMarker.batteryLevel > 50
                            ? "text-green-500"
                            : selectedMarker.batteryLevel > 20
                              ? "text-yellow-500"
                              : "text-red-500"
                        }`}
                      >
                        {selectedMarker.batteryLevel}%
                        {selectedMarker.isCharging && " 🔌"}
                      </Text>
                    </View>
                    <View className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
                      <View
                        className={`h-full ${
                          selectedMarker.batteryLevel > 50
                            ? "bg-green-500"
                            : selectedMarker.batteryLevel > 20
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${selectedMarker.batteryLevel}%` }}
                      />
                    </View>
                  </View>
                )}

                {/* Accuracy */}
                {selectedMarker.accuracy && (
                  <View className="bg-background p-3 rounded-lg">
                    <Text className="text-xs text-muted mb-1">GPS Accuracy</Text>
                    <Text className="text-sm font-mono text-foreground">
                      ±{selectedMarker.accuracy.toFixed(1)} meters
                    </Text>
                  </View>
                )}

                {/* Last Updated */}
                {selectedMarker.lastUpdated && (
                  <View className="bg-background p-3 rounded-lg">
                    <Text className="text-xs text-muted mb-1">Last Updated</Text>
                    <Text className="text-sm text-foreground">
                      {selectedMarker.lastUpdated.toLocaleTimeString()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Close Button */}
              <TouchableOpacity
                onPress={() => setSelectedMarker(null)}
                className="bg-primary py-3 rounded-lg mt-4"
              >
                <Text className="text-center font-bold text-background">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
