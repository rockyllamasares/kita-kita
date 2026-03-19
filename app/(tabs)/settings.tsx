import { ScrollView, Text, View, TouchableOpacity, Switch } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useLocationSettings } from "@/lib/settings-context";

export default function SettingsScreen() {
  const { settings, updateSettings } = useLocationSettings();

  const SettingRow = ({
    label,
    description,
    value,
    onToggle,
  }: {
    label: string;
    description?: string;
    value: boolean;
    onToggle: (value: boolean) => void;
  }) => (
    <View className="flex-row justify-between items-center bg-surface border border-border rounded-lg p-4 mb-3">
      <View className="flex-1 mr-4">
        <Text className="text-foreground font-semibold">{label}</Text>
        {description && <Text className="text-xs text-muted mt-1">{description}</Text>}
      </View>
      <Switch value={value} onValueChange={onToggle} />
    </View>
  );

  return (
    <ScreenContainer className="p-6 flex-1">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-8">
          {/* Header */}
          <View>
            <Text className="text-2xl font-bold text-foreground mb-2">Settings</Text>
            <Text className="text-sm text-muted">Configure your location tracking preferences</Text>
          </View>

          {/* Location Tracking Section */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Location Tracking</Text>

            <SettingRow
              label="Foreground Tracking"
              description="Share your location while app is open"
              value={settings.foregroundTracking}
              onToggle={(value) => updateSettings({ foregroundTracking: value })}
            />

            <SettingRow
              label="Background Tracking"
              description="Share your location even when app is closed (battery intensive)"
              value={settings.backgroundTracking}
              onToggle={(value) => updateSettings({ backgroundTracking: value })}
            />

            <View className="gap-2 px-4 py-3 bg-surface border border-border rounded-lg">
              <Text className="text-sm font-semibold text-foreground">Update Frequency</Text>
              <View className="flex-row gap-2 mt-2">
                {(["5s", "10s", "30s", "1min"] as const).map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    className={`flex-1 py-2 rounded-lg border ${
                      settings.updateFrequency === freq
                        ? "bg-primary border-primary"
                        : "border-border bg-background"
                    }`}
                    onPress={() => updateSettings({ updateFrequency: freq })}
                  >
                    <Text
                      className={`text-center text-sm font-semibold ${
                        settings.updateFrequency === freq ? "text-background" : "text-foreground"
                      }`}
                    >
                      {freq}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Battery Section */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Battery</Text>

            <SettingRow
              label="Battery Saver Mode"
              description="Increase location update intervals to save battery"
              value={settings.batterySaverMode}
              onToggle={(value) => updateSettings({ batterySaverMode: value })}
            />
          </View>

          {/* Notifications Section */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Notifications</Text>

            <SettingRow
              label="Enable Notifications"
              description="Receive alerts for group updates"
              value={settings.notificationsEnabled}
              onToggle={(value) => updateSettings({ notificationsEnabled: value })}
            />
          </View>

          {/* Privacy Section */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Privacy</Text>

            <SettingRow
              label="Private Mode"
              description="Hide your location from group members"
              value={settings.privateMode}
              onToggle={(value) => updateSettings({ privateMode: value })}
            />
          </View>

          {/* Info */}
          <View className="bg-blue-500/10 border border-blue-500 rounded-lg p-4 mb-8">
            <Text className="text-sm text-blue-700 font-semibold">💡 Tip</Text>
            <Text className="text-xs text-blue-600 mt-2">
              Settings are automatically saved. Adjust your update frequency based on your battery level and
              location accuracy needs.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
