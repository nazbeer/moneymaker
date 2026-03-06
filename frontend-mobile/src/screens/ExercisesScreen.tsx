import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { apiFetch } from "../lib/api";
import { COLORS } from "../lib/constants";
import type { Exercise } from "../lib/types";

export default function ExercisesScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const loadExercises = useCallback(async () => {
    try {
      const data = await apiFetch<Exercise[]>("/api/exercises");
      setExercises(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadExercises();
    }, [loadExercises])
  );

  function startExercise(exercise: Exercise) {
    if (exercise.isLocked) {
      Alert.alert("Premium Required", "Upgrade to access this exercise.");
      return;
    }
    setActiveExercise(exercise);
    setCurrentStep(0);
  }

  const categoryIcons: Record<string, string> = {
    breathing: "🌬️",
    meditation: "🧘",
    gratitude: "🙏",
    cbt: "🧠",
    mindfulness: "✨",
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadExercises(); }} />
        }
      >
        <Text style={styles.title}>Healing Exercises</Text>
        <Text style={styles.subtitle}>Guided practices for your wellbeing</Text>

        {exercises.map((exercise) => (
          <TouchableOpacity
            key={exercise.id}
            style={[styles.exerciseCard, exercise.isLocked && styles.lockedCard]}
            onPress={() => startExercise(exercise)}
          >
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseIcon}>
                {categoryIcons[exercise.category] || "🧘"}
              </Text>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                  {exercise.isLocked && <Text style={styles.lockIcon}>🔒</Text>}
                  {exercise.isPremium && !exercise.isLocked && (
                    <View style={styles.premiumBadge}>
                      <Text style={styles.premiumText}>PRO</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.exerciseMeta}>
                  {exercise.duration} min · {exercise.category}
                </Text>
              </View>
            </View>
            <Text style={styles.exerciseDesc}>{exercise.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={!!activeExercise} animationType="slide" presentationStyle="pageSheet">
        {activeExercise && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setActiveExercise(null)}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{activeExercise.title}</Text>
              <Text style={styles.stepCount}>
                {currentStep + 1}/{activeExercise.steps.length}
              </Text>
            </View>

            <View style={styles.stepContainer}>
              <Text style={styles.stepIcon}>
                {categoryIcons[activeExercise.category] || "🧘"}
              </Text>
              <Text style={styles.stepText}>
                {activeExercise.steps[currentStep]}
              </Text>

              <View style={styles.progressRow}>
                {activeExercise.steps.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.progressDot, i <= currentStep && styles.progressDotActive]}
                  />
                ))}
              </View>

              <View style={styles.navRow}>
                <TouchableOpacity
                  style={[styles.navButton, currentStep === 0 && styles.navButtonDisabled]}
                  onPress={() => setCurrentStep((s) => Math.max(0, s - 1))}
                  disabled={currentStep === 0}
                >
                  <Text style={styles.navButtonText}>Previous</Text>
                </TouchableOpacity>

                {currentStep < activeExercise.steps.length - 1 ? (
                  <TouchableOpacity
                    style={[styles.navButton, styles.navButtonPrimary]}
                    onPress={() => setCurrentStep((s) => s + 1)}
                  >
                    <Text style={[styles.navButtonText, { color: "#fff" }]}>Next</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.navButton, styles.navButtonPrimary]}
                    onPress={() => {
                      setActiveExercise(null);
                      Alert.alert("Well done! 🎉", "You completed the exercise.");
                    }}
                  >
                    <Text style={[styles.navButtonText, { color: "#fff" }]}>Finish</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "700", color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 20 },
  exerciseCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  lockedCard: { opacity: 0.6 },
  exerciseHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  exerciseIcon: { fontSize: 32 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  exerciseTitle: { fontSize: 16, fontWeight: "600", color: COLORS.text },
  lockIcon: { fontSize: 14 },
  premiumBadge: {
    backgroundColor: COLORS.primary + "20",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  premiumText: { fontSize: 10, fontWeight: "700", color: COLORS.primary },
  exerciseMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  exerciseDesc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
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
  closeText: { fontSize: 15, color: COLORS.primary, fontWeight: "600" },
  stepCount: { fontSize: 14, color: COLORS.textSecondary },
  stepContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  stepIcon: { fontSize: 64, marginBottom: 32 },
  stepText: { fontSize: 20, color: COLORS.text, textAlign: "center", lineHeight: 30, marginBottom: 40 },
  progressRow: { flexDirection: "row", gap: 8, marginBottom: 40 },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.border },
  progressDotActive: { backgroundColor: COLORS.primary },
  navRow: { flexDirection: "row", gap: 16, width: "100%" },
  navButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  navButtonPrimary: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  navButtonDisabled: { opacity: 0.4 },
  navButtonText: { fontSize: 15, fontWeight: "600", color: COLORS.text },
});
