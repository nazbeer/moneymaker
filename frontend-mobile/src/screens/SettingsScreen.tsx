import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { useAuth } from "../lib/auth-context";
import { COLORS, API_URL } from "../lib/constants";
import { apiFetch } from "../lib/api";

export default function SettingsScreen() {
  const { user, logout } = useAuth();

  async function handleUpgrade() {
    try {
      const data = await apiFetch<{ url: string }>("/api/stripe/checkout", {
        method: "POST",
      });
      if (data.url) {
        Linking.openURL(data.url);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  }

  function handleLogout() {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toUpperCase() || "?"}
          </Text>
        </View>
        <Text style={styles.profileName}>{user?.name || "User"}</Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>
        {user?.isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>Premium</Text>
          </View>
        )}
      </View>

      {!user?.isPremium && (
        <TouchableOpacity style={styles.upgradeCard} onPress={handleUpgrade}>
          <Text style={styles.upgradeEmoji}>✨</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
            <Text style={styles.upgradeDesc}>
              Unlimited AI chats, all exercises, and more for $6.99/month
            </Text>
          </View>
          <Text style={styles.upgradeArrow}>→</Text>
        </TouchableOpacity>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <SettingsRow label="Plan" value={user?.isPremium ? "Premium" : "Free"} />
        <SettingsRow label="Email" value={user?.email || ""} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <SettingsRow label="Version" value="1.0.0" />
        <SettingsRow label="App" value="HealMind" />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.settingsRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 100 },
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: "700", color: "#fff" },
  profileName: { fontSize: 20, fontWeight: "700", color: COLORS.text },
  profileEmail: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  premiumBadge: {
    marginTop: 8,
    backgroundColor: COLORS.primary + "20",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  upgradeCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  upgradeEmoji: { fontSize: 28 },
  upgradeTitle: { fontSize: 16, fontWeight: "700", color: "#fff" },
  upgradeDesc: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  upgradeArrow: { fontSize: 20, color: "#fff" },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowLabel: { fontSize: 15, color: COLORS.text },
  rowValue: { fontSize: 15, color: COLORS.textSecondary },
  logoutButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error,
    alignItems: "center",
    marginTop: 8,
  },
  logoutText: { fontSize: 16, fontWeight: "600", color: COLORS.error },
});
