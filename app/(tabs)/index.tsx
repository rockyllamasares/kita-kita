import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { GroupMap } from "@/components/group-map";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useLocation } from "@/hooks/use-location";
import { useBattery } from "@/hooks/use-battery";
import { useLocationPolling } from "@/hooks/use-location-polling";
import { useLocationSettings } from "@/lib/settings-context";
import { trpc } from "@/lib/trpc";

export default function HomeScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { location, error: locationError, loading: locationLoading, getCurrentLocation } = useLocation();
  const { battery } = useBattery();
  const { settings } = useLocationSettings();
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  // Query to get user's groups
  const { data: groups } = trpc.groups.list.useQuery(undefined, {
    enabled: !!user,
  });

  // Use location polling if foreground tracking is enabled and a group is selected
  const { isPolling, lastUpdated, error: pollingError, startPolling, stopPolling } = useLocationPolling({
    enabled: settings.foregroundTracking && !!selectedGroupId,
    interval: settings.updateFrequency,
    groupId: selectedGroupId ?? undefined,
  });

  // Query to get current group locations
  const { data: groupLocations, refetch: refetchLocations } = trpc.locations.getGroupLocations.useQuery(
    { groupId: selectedGroupId ?? 0 },
    {
      enabled: !!selectedGroupId,
      refetchInterval: 5000, // Auto-refresh every 5 seconds
    },
  );

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <Text className="text-foreground">Loading...</Text>
      </ScreenContainer>
    );
  }

  if (!user) {
    return null;
  }

  const batteryPercent = battery ? Math.round(battery.level * 100) : null;
  const batteryColor =
    batteryPercent === null ? "bg-gray-400" : batteryPercent > 50 ? "bg-green-500" : batteryPercent > 20 ? "bg-yellow-500" : "bg-red-500";

  return (
    <ScreenContainer className="flex-1 relative">
      {/* Battery Indicator (Top-Right) */}
      {battery && (
        <View className="absolute top-6 right-6 z-10">
          <View className="flex-row items-center gap-2 bg-surface border border-border rounded-full px-3 py-2">
            <Text className="text-lg">🔋</Text>
            <Text className={`font-bold ${
              batteryPercent! > 50 ? "text-green-500" : 
              batteryPercent! > 20 ? "text-yellow-500" : 
              "text-red-500"
            }`}>
              {batteryPercent}%
            </Text>
          </View>
        </View>
      )}

      {/* Low Battery Warning */}
      {battery && batteryPercent !== null && batteryPercent < 20 && !battery.isCharging && (
        <View className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4">
          <View className="flex-row items-center gap-2">
            <Text className="text-lg">⚠️</Text>
            <View className="flex-1">
              <Text className="font-semibold text-red-500">Low Battery</Text>
              <Text className="text-xs text-red-600">
                {batteryPercent}% remaining. Location updates may pause.
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Main Content */}
      {!selectedGroupId ? (
        // Group Selection View (ScrollView)
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} className="p-6">
          <View className="flex-1 gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Map View</Text>
            <Text className="text-sm text-muted">See your group members in real-time</Text>
          </View>

          {/* Location Status */}
          <View className="bg-surface border border-border rounded-lg p-4 gap-3">
            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-2">
                  <View
                    className={`w-3 h-3 rounded-full ${location ? "bg-green-500" : "bg-gray-400"}`}
                  />
                  <Text className="font-semibold text-foreground">
                    {location
                      ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                      : "Location unavailable"}
                  </Text>
                </View>
                {location && (
                  <View className="gap-1">
                    <Text className="text-xs text-muted">
                      Accuracy: {location.accuracy?.toFixed(1) ?? "unknown"} m
                    </Text>
                    {lastUpdated && (
                      <Text className="text-xs text-muted">
                        Updated: {lastUpdated.toLocaleTimeString()}
                      </Text>
                    )}
                  </View>
                )}
              </View>
              {locationLoading && <ActivityIndicator size="small" />}
            </View>

            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 bg-primary/20 py-2 rounded"
                onPress={() => getCurrentLocation()}
              >
                <Text className="text-primary text-center text-sm font-semibold">
                  {locationLoading ? "Getting..." : "Refresh"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-destructive/20 py-2 rounded">
                <Text className="text-destructive text-center text-sm font-semibold">
                  {isPolling ? "Stop" : "Start"}
                </Text>
              </TouchableOpacity>
            </View>

            {(locationError || pollingError) && (
              <Text className="text-xs text-destructive">
                Error: {(locationError || pollingError)?.message}
              </Text>
            )}
          </View>

          {/* Quick Stats */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Quick Stats</Text>
            <View className="flex-row gap-3">
              <StatCard
                label="Groups"
                value={groups?.length?.toString() ?? "0"}
                icon="👥"
              />
              <StatCard
                label="Members"
                value={groupLocations?.length?.toString() ?? "0"}
                icon="👤"
              />
              <StatCard
                label="Battery"
                value={batteryPercent !== null ? `${batteryPercent}%` : "--"}
                icon="🔋"
              />
            </View>
          </View>

          {/* Select Group */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Select Group</Text>
            {groups && groups.length > 0 ? (
              <View className="gap-2">
                {groups.map((group) => (
                  <TouchableOpacity
                    key={group.id}
                    className={`p-4 rounded-lg border ${
                      selectedGroupId === group.id
                        ? "bg-primary/20 border-primary"
                        : "bg-surface border-border"
                    }`}
                    onPress={() => {
                      setSelectedGroupId(group.id);
                      // Auto-start polling when group selected
                      if (settings.foregroundTracking && !isPolling) {
                        startPolling();
                      }
                    }}
                  >
                    <View className="flex-row justify-between items-center">
                      <View className="flex-1">
                        <Text
                          className={`font-semibold ${
                            selectedGroupId === group.id ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {group.name}
                        </Text>
                        <Text className="text-xs text-muted mt-1">{group.code}</Text>
                      </View>
                      {selectedGroupId === group.id && isPolling && (
                        <ActivityIndicator size="small" color="currentColor" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View className="bg-surface border border-border rounded-lg p-4">
                <Text className="text-sm text-muted">No groups. Create or join one!</Text>
              </View>
            )}
          </View>

          {/* Group Members Map */}
          {selectedGroupId && location && (
            <View className="flex-1 rounded-lg overflow-hidden border border-border">
              <GroupMap
                userLocation={location}
                groupLocations={
                  groupLocations
                    ? groupLocations.map((loc: any) => ({
                        id: String(loc.id),
                        userId: loc.userId,
                        userName: `User ${loc.userId}`,
                        latitude: loc.latitude,
                        longitude: loc.longitude,
                        accuracy: loc.accuracy,
                        batteryLevel: loc.batteryLevel,
                        isCharging: loc.isCharging,
                      }))
                    : []
                }
                isLoading={locationLoading}
                onRefresh={() => refetchLocations()}
              />
            </View>
          )}
        </View>
        </ScrollView>
      ) : (
        // Map View (Full Screen)
        <View className="flex-1 pt-6">
          <View className="px-6 pb-3">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-2xl font-bold text-foreground">Map View</Text>
                {groups && (
                  <Text className="text-sm text-muted">
                    {groups.find((g) => g.id === selectedGroupId)?.name}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setSelectedGroupId(null)}
                className="bg-surface border border-border rounded-full p-2"
              >
                <Text className="text-lg">✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Full-screen map */}
          <View className="flex-1">
            {location ? (
              <GroupMap
                userLocation={location}
                groupLocations={
                  groupLocations
                    ? groupLocations.map((loc: any) => ({
                        id: String(loc.id),
                        userId: loc.userId,
                        userName: `User ${loc.userId}`,
                        latitude: loc.latitude,
                        longitude: loc.longitude,
                        accuracy: loc.accuracy,
                        batteryLevel: loc.batteryLevel,
                        isCharging: loc.isCharging,
                      }))
                    : []
                }
                isLoading={locationLoading}
                onRefresh={() => refetchLocations()}
              />
            ) : (
              <View className="flex-1 justify-center items-center bg-surface">
                <Text className="text-foreground">Loading map...</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View className="flex-1 bg-surface border border-border rounded-lg p-4 items-center">
      <Text className="text-2xl mb-2">{icon}</Text>
      <Text className="text-2xl font-bold text-foreground">{value}</Text>
      <Text className="text-xs text-muted mt-1">{label}</Text>
    </View>
  );
}
