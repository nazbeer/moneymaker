import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Switch,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { apiFetch } from "../lib/api";
import { COLORS, COMMUNITY_CATEGORIES, REACTION_EMOJIS } from "../lib/constants";
import type { CommunityPost, PaginatedResponse } from "../lib/types";
import { format } from "date-fns";

export default function CommunityScreen() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState(COMMUNITY_CATEGORIES[0].name);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      const query = activeCategory ? `?category=${activeCategory}` : "";
      const data = await apiFetch<PaginatedResponse<CommunityPost>>(`/api/community${query}`);
      setPosts(data.posts || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeCategory]);

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [loadPosts])
  );

  async function handleReact(postId: string, type: string) {
    try {
      await apiFetch(`/api/community/${postId}/react`, {
        method: "POST",
        body: JSON.stringify({ type }),
      });
      loadPosts();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  }

  async function handleCreate() {
    if (!newContent.trim()) {
      Alert.alert("Error", "Please write something");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/api/community", {
        method: "POST",
        body: JSON.stringify({
          content: newContent.trim(),
          category: newCategory,
          isAnonymous,
        }),
      });
      setNewContent("");
      setShowCreate(false);
      loadPosts();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function renderPost({ item }: { item: CommunityPost }) {
    const categoryColor = COMMUNITY_CATEGORIES.find((c) => c.name === item.category)?.color || COLORS.primary;

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
          <Text style={styles.postCategory}>{item.category}</Text>
          <Text style={styles.postDate}>{format(new Date(item.createdAt), "MMM d")}</Text>
        </View>
        <Text style={styles.postAuthor}>
          {item.isAnonymous ? "Anonymous" : item.user?.name || "Unknown"}
        </Text>
        <Text style={styles.postContent}>{item.content}</Text>
        <View style={styles.reactionsRow}>
          {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => {
            const reaction = item.reactions?.find((r) => r.type === type);
            const count = reaction?.count || 0;
            const reacted = item.userReacted?.includes(type);
            return (
              <TouchableOpacity
                key={type}
                style={[styles.reactionButton, reacted && styles.reactionActive]}
                onPress={() => handleReact(item.id, type)}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                {count > 0 && <Text style={styles.reactionCount}>{count}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <ScrollableCategories
          activeCategory={activeCategory}
          onSelect={(cat) => {
            setActiveCategory(cat === activeCategory ? null : cat);
            setLoading(true);
          }}
        />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadPosts(); }} />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : (
            <Text style={styles.emptyText}>No posts yet. Be the first to share!</Text>
          )
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowCreate(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Share</Text>
            <TouchableOpacity onPress={handleCreate} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color={COLORS.primary} size="small" />
              ) : (
                <Text style={styles.postText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <TextInput
              style={styles.createInput}
              placeholder="Share what's on your mind..."
              placeholderTextColor={COLORS.textTertiary}
              value={newContent}
              onChangeText={setNewContent}
              multiline
              autoFocus
              textAlignVertical="top"
            />

            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.categoryPicker}>
              {COMMUNITY_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.name}
                  style={[styles.catOption, newCategory === cat.name && { backgroundColor: cat.color + "20", borderColor: cat.color }]}
                  onPress={() => setNewCategory(cat.name)}
                >
                  <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                  <Text style={[styles.catText, newCategory === cat.name && { color: cat.color }]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.anonRow}>
              <Text style={styles.fieldLabel}>Post anonymously</Text>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{ true: COLORS.primary }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ScrollableCategories({
  activeCategory,
  onSelect,
}: {
  activeCategory: string | null;
  onSelect: (cat: string) => void;
}) {
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={COMMUNITY_CATEGORIES}
      keyExtractor={(item) => item.name}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.filterChip,
            activeCategory === item.name && { backgroundColor: item.color + "20", borderColor: item.color },
          ]}
          onPress={() => onSelect(item.name)}
        >
          <Text
            style={[styles.filterText, activeCategory === item.name && { color: item.color }]}
          >
            {item.name}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  filterRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  filterText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "500" },
  listContent: { padding: 16, paddingBottom: 100 },
  postCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  postCategory: { fontSize: 12, fontWeight: "600", color: COLORS.textSecondary, flex: 1 },
  postDate: { fontSize: 12, color: COLORS.textTertiary },
  postAuthor: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 },
  postContent: { fontSize: 15, color: COLORS.text, lineHeight: 22, marginBottom: 12 },
  reactionsRow: { flexDirection: "row", gap: 8 },
  reactionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSecondary,
  },
  reactionActive: { backgroundColor: COLORS.primary + "15" },
  reactionEmoji: { fontSize: 16 },
  reactionCount: { fontSize: 12, color: COLORS.textSecondary },
  emptyText: { textAlign: "center", color: COLORS.textSecondary, marginTop: 40 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: { color: "#fff", fontSize: 28, fontWeight: "300", marginTop: -2 },
  // Modal
  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  modalTitle: { fontSize: 17, fontWeight: "600", color: COLORS.text },
  cancelText: { fontSize: 15, color: COLORS.textSecondary },
  postText: { fontSize: 15, color: COLORS.primary, fontWeight: "600" },
  modalBody: { padding: 20 },
  createInput: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
    minHeight: 120,
    marginBottom: 20,
  },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: COLORS.text, marginBottom: 8 },
  categoryPicker: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  catOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catText: { fontSize: 13, color: COLORS.textSecondary },
  anonRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
