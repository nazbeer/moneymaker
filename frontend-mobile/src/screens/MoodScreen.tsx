import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { apiFetch } from "../lib/api";
import { COLORS, MOOD_EMOJIS, MOOD_LABELS, MOOD_COLORS, MOOD_TAGS } from "../lib/constants";
import type { MoodEntry } from "../lib/types";
import { format } from "date-fns";

export default function MoodScreen() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [logging, setLogging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEntries = useCallback(async () => {
    try {
      const data = await apiFetch<MoodEntry[]>("/api/mood?days=30");
      setEntries(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleLog() {
    if (!selectedMood) {
      Alert.alert("Select a mood", "Tap an emoji to select how you're feeling");
      return;
    }
    setLogging(true);
    try {
      await apiFetch("/api/mood", {
        method: "POST",
        body: JSON.stringify({
          mood: selectedMood,
          note: note.trim() || undefined,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
        }),
      });
      setSelectedMood(null);
      setNote("");
      setSelectedTags([]);
      loadEntries();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLogging(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadEntries(); }} />
      }
    >
      <Text style={styles.title}>How are you feeling?</Text>

      <View style={styles.moodRow}>
        {[1, 2, 3, 4, 5].map((mood) => (
          <TouchableOpacity
            key={mood}
            style={[
              styles.moodButton,
              selectedMood === mood && { backgroundColor: MOOD_COLORS[mood] + "20", borderColor: MOOD_COLORS[mood] },
            ]}
            onPress={() => setSelectedMood(mood)}
          >
            <Text style={styles.moodEmoji}>{MOOD_EMOJIS[mood]}</Text>
            <Text style={[styles.moodLabel, selectedMood === mood && { color: MOOD_COLORS[mood] }]}>
              {MOOD_LABELS[mood]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.noteInput}
        placeholder="Add a note (optional)..."
        placeholderTextColor={COLORS.textTertiary}
        value={note}
        onChangeText={setNote}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.tagsTitle}>Tags</Text>
      <View style={styles.tagsRow}>
        {MOOD_TAGS.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[styles.tag, selectedTags.includes(tag) && styles.tagSelected]}
            onPress={() => toggleTag(tag)}
          >
            <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextSelected]}>
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.logButton, logging && styles.logButtonDisabled]}
        onPress={handleLog}
        disabled={logging}
      >
        {logging ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.logButtonText}>Log Mood</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Recent Entries</Text>
      {loading ? (
        <ActivityIndicator color={COLORS.primary} />
      ) : entries.length === 0 ? (
        <Text style={styles.emptyText}>No mood entries yet. Log your first mood above!</Text>
      ) : (
        entries.slice(0, 10).map((entry) => (
          <View key={entry.id} style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <Text style={styles.entryEmoji}>{MOOD_EMOJIS[entry.mood]}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.entryMood}>{MOOD_LABELS[entry.mood]}</Text>
                <Text style={styles.entryDate}>
                  {format(new Date(entry.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </Text>
              </View>
            </View>
            {entry.note && <Text style={styles.entryNote}>{entry.note}</Text>}
            {entry.tags.length > 0 && (
              <View style={styles.entryTags}>
                {entry.tags.map((tag) => (
                  <View key={tag} style={styles.entryTag}>
                    <Text style={styles.entryTagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: "700", color: COLORS.text, marginBottom: 20, textAlign: "center" },
  moodRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  moodButton: {
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    flex: 1,
    marginHorizontal: 2,
  },
  moodEmoji: { fontSize: 28 },
  moodLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 4 },
  noteInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  tagsTitle: { fontSize: 14, fontWeight: "600", color: COLORS.text, marginBottom: 8 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagSelected: { backgroundColor: COLORS.primary + "20", borderColor: COLORS.primary },
  tagText: { fontSize: 13, color: COLORS.textSecondary },
  tagTextSelected: { color: COLORS.primary, fontWeight: "600" },
  logButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 32,
  },
  logButtonDisabled: { opacity: 0.6 },
  logButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: COLORS.text, marginBottom: 12 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center", marginTop: 20 },
  entryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  entryHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  entryEmoji: { fontSize: 32 },
  entryMood: { fontSize: 16, fontWeight: "600", color: COLORS.text },
  entryDate: { fontSize: 12, color: COLORS.textSecondary },
  entryNote: { fontSize: 14, color: COLORS.text, marginTop: 8, lineHeight: 20 },
  entryTags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  entryTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: COLORS.primary + "15",
  },
  entryTagText: { fontSize: 11, color: COLORS.primary },
});
