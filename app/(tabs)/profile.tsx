import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      logout();
      router.replace("/");
    },
  });

  if (!user) {
    return (
      <ScreenContainer className="p-6 justify-center">
        <View className="items-center gap-3">
          <Text className="text-lg font-semibold text-foreground">Not logged in</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6 flex-1">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-8">
          {/* Profile Header */}
          <View className="items-center gap-4 pt-8">
            <View className="w-20 h-20 bg-primary rounded-full flex justify-center items-center">
              <Text className="text-3xl font-bold text-background">
                {user.name?.[0]?.toUpperCase() ?? "U"}
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-foreground">{user.name}</Text>
              <Text className="text-sm text-muted mt-1">{user.email}</Text>
            </View>
          </View>

          {/* User Info Cards */}
          <View className="gap-3">
            <View className="bg-surface border border-border rounded-lg p-4">
              <Text className="text-xs text-muted uppercase font-semibold mb-2">User ID</Text>
              <Text className="text-foreground">{user.id}</Text>
            </View>
            <View className="bg-surface border border-border rounded-lg p-4">
              <Text className="text-xs text-muted uppercase font-semibold mb-2">Login Method</Text>
              <Text className="text-foreground capitalize">{user.loginMethod ?? "Unknown"}</Text>
            </View>
            <View className="bg-surface border border-border rounded-lg p-4">
              <Text className="text-xs text-muted uppercase font-semibold mb-2">Last Signed In</Text>
              <Text className="text-foreground">
                {new Date(user.lastSignedIn).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View className="gap-3 mt-auto mb-8">
            <TouchableOpacity className="bg-primary py-4 rounded-lg active:opacity-80">
              <Text className="text-background text-center font-semibold">Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-destructive/20 py-4 rounded-lg active:opacity-80"
              onPress={() => logoutMutation.mutate()}
            >
              <Text className="text-destructive text-center font-semibold">
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
