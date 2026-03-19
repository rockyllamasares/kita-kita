import { ScrollView, Text, View, TouchableOpacity, FlatList, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function GroupsScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  // Query to list user's groups
  const { data: groups, isLoading, refetch } = trpc.groups.list.useQuery(undefined, {
    enabled: !!user,
  });

  const createGroupMutation = trpc.groups.create.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const joinGroupMutation = trpc.groups.joinByCode.useMutation({
    onSuccess: () => {
      setJoinCode("");
      setShowJoinModal(false);
      refetch();
    },
  });

  if (!user) {
    return (
      <ScreenContainer className="p-6 justify-center">
        <View className="items-center gap-3">
          <Text className="text-lg font-semibold text-foreground">Please log in</Text>
          <Text className="text-sm text-muted">to see your groups</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4 flex-1">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-2xl font-bold text-foreground">Groups</Text>
        <View className="flex-row gap-2">
          <TouchableOpacity
            className="bg-primary px-4 py-2 rounded-lg active:opacity-80"
            onPress={() => setShowJoinModal(true)}
          >
            <Text className="text-background font-semibold text-sm">Join</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-secondary px-4 py-2 rounded-lg active:opacity-80"
            onPress={() => {
              createGroupMutation.mutate({
                name: `Group ${new Date().getTime()}`,
                description: "New group",
              });
            }}
          >
            <Text className="text-foreground font-semibold text-sm">Create</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-muted">Loading groups...</Text>
        </View>
      ) : groups && groups.length > 0 ? (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View className="bg-surface border border-border rounded-lg p-4 mb-3">
              <Text className="text-lg font-semibold text-foreground">{item.name}</Text>
              <Text className="text-sm text-muted mt-1">Code: {item.code}</Text>
              <View className="flex-row gap-2 mt-3">
                <TouchableOpacity className="flex-1 bg-primary/20 py-2 rounded active:opacity-80">
                  <Text className="text-primary text-center font-semibold text-sm">View</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 bg-destructive/20 py-2 rounded active:opacity-80">
                  <Text className="text-destructive text-center font-semibold text-sm">Leave</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          scrollEnabled={false}
        />
      ) : (
        <View className="flex-1 justify-center items-center">
          <Text className="text-muted">No groups yet. Create or join one!</Text>
        </View>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <View className="absolute inset-0 bg-black/20 justify-center items-center">
          <View className="bg-background rounded-lg p-6 w-5/6 gap-4">
            <Text className="text-lg font-semibold text-foreground">Join Group</Text>
            <View className="border border-border rounded-lg px-4 py-3">
              <TextInput
                className="text-foreground"
                placeholder="Enter group code"
                placeholderTextColor={colors.muted}
                value={joinCode}
                onChangeText={setJoinCode}
              />
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 bg-muted py-3 rounded-lg active:opacity-80"
                onPress={() => {
                  setShowJoinModal(false);
                  setJoinCode("");
                }}
              >
                <Text className="text-foreground text-center font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-primary py-3 rounded-lg active:opacity-80"
                onPress={() => joinGroupMutation.mutate({ code: joinCode })}
              >
                <Text className="text-background text-center font-semibold">Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}
