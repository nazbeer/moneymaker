import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../lib/auth-context";
import { apiFetch } from "../lib/api";
import { COLORS, MOOD_EMOJIS } from "../lib/constants";
import type { DashboardData } from "../lib/types";

interface Props {
  onNavigate: (screen: string) => void;
}

export default function DashboardScreen({ onNavigate }: Props) {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [affirmation, setAffirmation] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [dash, aff] = await Promise.all([
        apiFetch<DashboardData>("/api/dashboard"),
        apiFetch<{ affirmation: string }>("/api/affirmations"),
      ]);
      setData(dash);
      setAffirmation(aff.affirmation);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const quickActions = [
    { label: "Log Mood", emoji: "😊", screen: "Mood" },
    { label: "Chat", emoji: "💬", screen: "Chat" },
    { label: "Journal", emoji: "📝", screen: "Journal" },
    { label: "Exercises", emoji: "🧘", screen: "Exercises" },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />
      }
    >
      <Text style={styles.greeting}>
        Welcome back, {user?.name || "friend"} 👋
      </Text>

      {affirmation ? (
        <View style={styles.affirmationCard}>
          <Text style={styles.affirmationLabel}>Daily Affirmation</Text>
          <Text style={styles.affirmationText}>"{affirmation}"</Text>
        </View>
      ) : null}

      <View style={styles.statsRow}>
        <StatCard label="Streak" value={`${data?.currentStreak ?? 0}🔥`} />
        <StatCard label="Avg Mood" value={data?.avgMood ? `${data.avgMood.toFixed(1)} ${MOOD_EMOJIS[Math.round(data.avgMood)] || ""}` : "—"} />
      </View>
      <View style={styles.statsRow}>
        <StatCard label="Moods Logged" value={String(data?.totalMoods ?? 0)} />
        <StatCard label="Chats" value={String(data?.totalChats ?? 0)} />
        <StatCard label="Journals" value={String(data?.totalJournals ?? 0)} />
      </View>

      {data?.moodTrend && data.moodTrend.length > 0 && (
        <View style={styles.trendCard}>
          <Text style={styles.sectionTitle}>Recent Mood Trend</Text>
          <View style={styles.trendRow}>
            {data.moodTrend.slice(-7).map((entry, i) => (
              <View key={i} style={styles.trendItem}>
                <Text style={styles.trendEmoji}>
                  {MOOD_EMOJIS[entry.mood] || "😐"}
                </Text>
                <View
                  style={[
                    styles.trendBar,
                    { height: (entry.mood / 5) * 60, backgroundColor: COLORS.primary },
                  ]}
                />
              </View>
            ))}
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.screen}
            style={styles.actionCard}
            onPress={() => onNavigate(action.screen)}
          >
            <Text style={styles.actionEmoji}>{action.emoji}</Text>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  greeting: { fontSize: 24, fontWeight: "700", color: COLORS.text, marginBottom: 16 },
  affirmationCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  affirmationLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "600", marginBottom: 8 },
  affirmationText: { color: "#fff", fontSize: 16, fontStyle: "italic", lineHeight: 24 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: { fontSize: 20, fontWeight: "700", color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: COLORS.text, marginBottom: 12, marginTop: 8 },
  trendCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  trendRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "flex-end", height: 80 },
  trendItem: { alignItems: "center" },
  trendEmoji: { fontSize: 16, marginBottom: 4 },
  trendBar: { width: 20, borderRadius: 4, minHeight: 4 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  actionCard: {
    width: "47%",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionEmoji: { fontSize: 32, marginBottom: 8 },
  actionLabel: { fontSize: 14, fontWeight: "600", color: COLORS.text },
});
