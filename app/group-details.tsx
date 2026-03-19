import { ScrollView, Text, View, TouchableOpacity, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";

export default function GroupDetailsScreen() {
  const { groupId } = useLocalSearchParams();
  const router = useRouter();
  const [showMemberOptions, setShowMemberOptions] = useState<number | null>(null);

  // Mock group data
  const group = {
    id: 1,
    name: "Weekend Trip",
    code: "KITA-ABC123",
    description: "Tracking for weekend trip to the beach",
    ownerId: 1,
    memberCount: 4,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  };

  // Mock members data
  const members = [
    {
      id: 1,
      name: "You",
      email: "user@example.com",
      isOwner: true,
      battery: 85,
      isOnline: true,
    },
    {
      id: 2,
      name: "John",
      email: "john@example.com",
      isOwner: false,
      battery: 45,
      isOnline: true,
    },
    {
      id: 3,
      name: "Jane",
      email: "jane@example.com",
      isOwner: false,
      battery: 20,
      isOnline: true,
    },
    {
      id: 4,
      name: "Bob",
      email: "bob@example.com",
      isOwner: false,
      battery: 100,
      isOnline: false,
    },
  ];

  const handleCopyCode = () => {
    // Copy to clipboard
    alert("Group code copied!");
  };

  const handleShareCode = () => {
    alert("Sharing group code...");
  };

  const handleRemoveMember = (memberId: number) => {
    alert(`Remove member ${memberId}?`);
  };

  const handleLeaveGroup = () => {
    alert("Leave group?");
    router.back();
  };

  return (
    <ScreenContainer className="p-4 flex-1">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-6 pb-8">
          {/* Back Button */}
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => router.back()}
          >
            <Text className="text-lg text-primary">← Back</Text>
          </TouchableOpacity>

          {/* Group Header */}
          <View className="gap-4">
            <View className="gap-2">
              <Text className="text-3xl font-bold text-foreground">{group.name}</Text>
              <Text className="text-sm text-muted">{group.description}</Text>
            </View>

            {/* Group Code Card */}
            <View className="bg-surface border border-border rounded-lg p-4 gap-3">
              <View className="gap-2">
                <Text className="text-xs text-muted uppercase font-semibold">Group Code</Text>
                <Text className="text-2xl font-bold text-foreground font-mono">{group.code}</Text>
              </View>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 bg-primary/20 py-2 rounded-lg"
                  onPress={handleCopyCode}
                >
                  <Text className="text-primary text-center font-semibold text-sm">Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-primary/20 py-2 rounded-lg"
                  onPress={handleShareCode}
                >
                  <Text className="text-primary text-center font-semibold text-sm">Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Members Section */}
          <View className="gap-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-semibold text-foreground">Members ({members.length})</Text>
              <View className="bg-primary/20 px-3 py-1 rounded-full">
                <Text className="text-primary text-xs font-semibold">{members.filter(m => m.isOnline).length} Online</Text>
              </View>
            </View>

            <FlatList
              data={members}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View className="bg-surface border border-border rounded-lg p-4 mb-3">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="font-semibold text-foreground">{item.name}</Text>
                        {item.isOwner && (
                          <View className="bg-primary/20 px-2 py-1 rounded">
                            <Text className="text-primary text-xs font-semibold">Owner</Text>
                          </View>
                        )}
                        <View
                          className={`w-2 h-2 rounded-full ${
                            item.isOnline ? "bg-green-500" : "bg-muted"
                          }`}
                        />
                      </View>
                      <Text className="text-sm text-muted mt-1">{item.email}</Text>
                    </View>
                    {/* Battery Status */}
                    <View className="items-center gap-1">
                      <Text className="text-sm font-bold text-foreground">{item.battery}%</Text>
                      <View className="w-8 h-4 border border-border rounded-sm overflow-hidden">
                        <View
                          className={`h-full ${
                            item.battery > 50
                              ? "bg-green-500"
                              : item.battery > 20
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${item.battery}%` }}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Member Actions */}
                  {item.id !== 1 && (
                    <TouchableOpacity
                      className="bg-destructive/20 py-2 rounded"
                      onPress={() => handleRemoveMember(item.id)}
                    >
                      <Text className="text-destructive text-center text-sm font-semibold">Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />
          </View>

          {/* Group Info */}
          <View className="bg-surface border border-border rounded-lg p-4 gap-3">
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Created</Text>
                <Text className="text-sm text-foreground font-semibold">
                  {group.createdAt.toLocaleDateString()}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Members</Text>
                <Text className="text-sm text-foreground font-semibold">{group.memberCount}</Text>
              </View>
            </View>
          </View>

          {/* Danger Zone */}
          <View className="gap-3 border-t border-border pt-6">
            <Text className="text-lg font-semibold text-destructive">Danger Zone</Text>
            <TouchableOpacity
              className="bg-destructive/20 py-3 rounded-lg active:opacity-80"
              onPress={handleLeaveGroup}
            >
              <Text className="text-destructive text-center font-semibold">Leave Group</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
