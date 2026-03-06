import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { apiFetch } from "../lib/api";
import { COLORS, JOURNAL_PROMPTS } from "../lib/constants";
import type { JournalEntry, PaginatedResponse } from "../lib/types";
import { format } from "date-fns";

export default function JournalScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWrite, setShowWrite] = useState(false);
  const [activePrompt, setActivePrompt] = useState(JOURNAL_PROMPTS[0]);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadEntries = useCallback(async () => {
    try {
      const data = await apiFetch<PaginatedResponse<JournalEntry>>("/api/journal");
      setEntries(data.entries || []);
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

  function pickRandomPrompt() {
    const p = JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)];
    setActivePrompt(p);
  }

  async function handleSubmit() {
    if (!content.trim()) {
      Alert.alert("Error", "Please write something before submitting");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/api/journal", {
        method: "POST",
        body: JSON.stringify({
          prompt: activePrompt.prompt,
          content: content.trim(),
          category: activePrompt.category,
        }),
      });
      setContent("");
      setShowWrite(false);
      loadEntries();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadEntries(); }} />
        }
      >
        <TouchableOpacity style={styles.promptCard} onPress={() => { pickRandomPrompt(); setShowWrite(true); }}>
          <Text style={styles.promptLabel}>Today's Prompt</Text>
          <Text style={styles.promptText}>{activePrompt.prompt}</Text>
          <Text style={styles.promptAction}>Tap to start writing →</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Your Entries</Text>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : entries.length === 0 ? (
          <Text style={styles.emptyText}>No journal entries yet. Tap the prompt above to start!</Text>
        ) : (
          entries.map((entry) => (
            <View key={entry.id} style={styles.entryCard}>
              <Text style={styles.entryPrompt}>{entry.prompt}</Text>
              <Text style={styles.entryContent} numberOfLines={4}>{entry.content}</Text>
              <View style={styles.entryFooter}>
                {entry.category && (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{entry.category}</Text>
                  </View>
                )}
                <Text style={styles.entryDate}>
                  {format(new Date(entry.createdAt), "MMM d, yyyy")}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showWrite} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowWrite(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Write</Text>
            <TouchableOpacity onPress={handleSubmit} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color={COLORS.primary} size="small" />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.modalPromptCard}>
              <Text style={styles.modalPrompt}>{activePrompt.prompt}</Text>
              <TouchableOpacity onPress={pickRandomPrompt}>
                <Text style={styles.shuffleText}>🔀 New prompt</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.writeInput}
              placeholder="Start writing your thoughts..."
              placeholderTextColor={COLORS.textTertiary}
              value={content}
              onChangeText={setContent}
              multiline
              autoFocus
              textAlignVertical="top"
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 100 },
  promptCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  promptLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "600", marginBottom: 8 },
  promptText: { color: "#fff", fontSize: 16, lineHeight: 24, marginBottom: 12 },
  promptAction: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "600" },
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
  entryPrompt: { fontSize: 13, color: COLORS.primary, fontWeight: "600", marginBottom: 8 },
  entryContent: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  entryFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: COLORS.primary + "15",
  },
  categoryText: { fontSize: 11, color: COLORS.primary, fontWeight: "600" },
  entryDate: { fontSize: 12, color: COLORS.textSecondary },
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
  saveText: { fontSize: 15, color: COLORS.primary, fontWeight: "600" },
  modalContent: { flex: 1, padding: 20 },
  modalPromptCard: {
    backgroundColor: COLORS.primary + "10",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  modalPrompt: { fontSize: 15, color: COLORS.primary, fontWeight: "600", lineHeight: 22, marginBottom: 8 },
  shuffleText: { fontSize: 13, color: COLORS.primaryLight },
  writeInput: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
    minHeight: 200,
  },
});
