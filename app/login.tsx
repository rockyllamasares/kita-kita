import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { trpc } from "@/lib/trpc";

export default function LoginScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);
  const demoLoginMutation = trpc.auth.demoLogin.useMutation();

  useEffect(() => {
    // If user is already authenticated, redirect to home
    if (!loading && user) {
      router.replace("/(tabs)");
    }
  }, [user, loading, router]);

  // Auto-login on web for testing
  useEffect(() => {
    if (Platform.OS === "web" && !loading && !user && !isAutoLoggingIn) {
      console.log("[Login] Auto-logging in demo user on web...");
      setIsAutoLoggingIn(true);
      demoLoginMutation.mutate(
        {},
        {
          onSuccess: () => {
            console.log("[Login] Demo login successful");
            router.replace("/(tabs)");
          },
          onError: (error) => {
            console.error("[Login] Demo login failed:", error);
            setIsAutoLoggingIn(false);
          },
        }
      );
    }
  }, [loading, user, isAutoLoggingIn]);

  const handleLoginWithOAuth = () => {
    // Redirect to OAuth endpoint
    router.push("/oauth/callback");
  };

  const handleDemoLogin = async () => {
    setIsAutoLoggingIn(true);
    demoLoginMutation.mutate(
      {},
      {
        onSuccess: () => {
          router.replace("/(tabs)");
        },
        onError: () => {
          setIsAutoLoggingIn(false);
        },
      }
    );
  };

  if (loading || isAutoLoggingIn) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" />
        <Text className="text-foreground mt-4">Loading...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="justify-between p-6">
      <View className="flex-1 justify-center gap-8">
        {/* Hero Section */}
        <View className="items-center gap-4">
          <View className="w-24 h-24 bg-primary rounded-full flex justify-center items-center mb-4">
            <Text className="text-5xl">📍</Text>
          </View>
          <Text className="text-4xl font-bold text-foreground text-center">Kita Kita</Text>
          <Text className="text-lg text-muted text-center">
            Share your location with friends and family in real-time
          </Text>
        </View>

        {/* Features */}
        <View className="gap-4">
          <FeatureItem icon="📍" title="Real-time Location" description="See where your group members are" />
          <FeatureItem icon="🔋" title="Battery Status" description="Know who needs to charge" />
          <FeatureItem icon="👥" title="Group Tracking" description="Create or join location sharing groups" />
        </View>
      </View>

      {/* Login Buttons */}
      <View className="gap-3 mb-8">
        <TouchableOpacity
          className="bg-primary py-4 rounded-lg active:opacity-80"
          onPress={handleLoginWithOAuth}
          disabled={demoLoginMutation.isPending}
        >
          <Text className="text-background text-center font-bold text-lg">Login with Manus</Text>
        </TouchableOpacity>

        {/* Demo Login Button (Web Testing) */}
        {Platform.OS === "web" && (
          <TouchableOpacity
            className="bg-secondary py-4 rounded-lg active:opacity-80 border border-border"
            onPress={handleDemoLogin}
            disabled={demoLoginMutation.isPending}
          >
            <Text className="text-foreground text-center font-bold text-lg">
              {demoLoginMutation.isPending ? "Logging in..." : "Demo Login (Testing)"}
            </Text>
          </TouchableOpacity>
        )}

        <Text className="text-xs text-muted text-center">
          By logging in, you agree to our Terms of Service
        </Text>
      </View>
    </ScreenContainer>
  );
}

function FeatureItem({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <View className="flex-row items-start gap-4 bg-surface border border-border rounded-lg p-4">
      <Text className="text-3xl">{icon}</Text>
      <View className="flex-1">
        <Text className="text-foreground font-semibold">{title}</Text>
        <Text className="text-sm text-muted mt-1">{description}</Text>
      </View>
    </View>
  );
}
