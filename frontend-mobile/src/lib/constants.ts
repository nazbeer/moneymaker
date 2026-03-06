export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export const MOOD_EMOJIS: Record<number, string> = {
  1: "😢",
  2: "😔",
  3: "😐",
  4: "🙂",
  5: "😊",
};

export const MOOD_LABELS: Record<number, string> = {
  1: "Terrible",
  2: "Bad",
  3: "Okay",
  4: "Good",
  5: "Great",
};

export const MOOD_COLORS: Record<number, string> = {
  1: "#EF4444",
  2: "#F97316",
  3: "#EAB308",
  4: "#22C55E",
  5: "#10B981",
};

export const MOOD_TAGS = [
  "anxious",
  "lonely",
  "heartbroken",
  "hopeful",
  "grateful",
  "angry",
  "peaceful",
  "confused",
  "motivated",
  "overwhelmed",
  "healing",
  "loved",
];

export const COMMUNITY_CATEGORIES = [
  { name: "Heartbreak", color: "#EF4444" },
  { name: "Anxiety", color: "#EAB308" },
  { name: "Grief", color: "#8B5CF6" },
  { name: "Self Love", color: "#EC4899" },
  { name: "Healing", color: "#22C55E" },
  { name: "Growth", color: "#3B82F6" },
];

export const REACTION_EMOJIS: Record<string, string> = {
  heart: "❤️",
  hug: "🤗",
  strength: "💪",
  relate: "🤝",
};

export const JOURNAL_PROMPTS = [
  { prompt: "What are three things you're grateful for today?", category: "gratitude" },
  { prompt: "Describe a moment today that made you smile.", category: "gratitude" },
  { prompt: "What emotion is strongest right now? Where do you feel it?", category: "reflection" },
  { prompt: "What would you tell your younger self about this moment?", category: "reflection" },
  { prompt: "Write a letter to someone who hurt you (you don't have to send it).", category: "healing" },
  { prompt: "What's one thing you've learned from your pain?", category: "healing" },
  { prompt: "What's one small step you can take toward your goal today?", category: "growth" },
  { prompt: "How have you grown in the past month?", category: "growth" },
];

export const COLORS = {
  primary: "#7C3AED",
  primaryLight: "#A78BFA",
  primaryDark: "#5B21B6",
  background: "#F9FAFB",
  surface: "#FFFFFF",
  surfaceSecondary: "#F3F4F6",
  text: "#111827",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",
  border: "#E5E7EB",
  error: "#EF4444",
  success: "#22C55E",
  warning: "#F59E0B",
};
