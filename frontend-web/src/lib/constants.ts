export const MOOD_EMOJIS: Record<number, { emoji: string; label: string }> = {
  1: { emoji: "😢", label: "Very Low" },
  2: { emoji: "😔", label: "Low" },
  3: { emoji: "😐", label: "Okay" },
  4: { emoji: "🙂", label: "Good" },
  5: { emoji: "😊", label: "Great" },
};

export const MOOD_TAGS = [
  "anxious", "lonely", "heartbroken", "hopeful", "grateful",
  "angry", "peaceful", "confused", "motivated", "overwhelmed",
  "healing", "loved",
];

export const POST_CATEGORIES = [
  { value: "heartbreak", label: "Heartbreak", color: "bg-red-100 text-red-700" },
  { value: "anxiety", label: "Anxiety", color: "bg-yellow-100 text-yellow-700" },
  { value: "grief", label: "Grief", color: "bg-purple-100 text-purple-700" },
  { value: "self-love", label: "Self Love", color: "bg-pink-100 text-pink-700" },
  { value: "healing", label: "Healing", color: "bg-green-100 text-green-700" },
  { value: "growth", label: "Growth", color: "bg-blue-100 text-blue-700" },
];

export const REACTION_TYPES = [
  { type: "heart", emoji: "❤️", label: "Love" },
  { type: "hug", emoji: "🤗", label: "Hug" },
  { type: "strength", emoji: "💪", label: "Strength" },
  { type: "relate", emoji: "🤝", label: "I relate" },
];

export const JOURNAL_PROMPTS = [
  { category: "gratitude", prompt: "What are 3 things you're grateful for today?" },
  { category: "gratitude", prompt: "Who made you smile recently and why?" },
  { category: "reflection", prompt: "What emotion has been strongest today? What triggered it?" },
  { category: "reflection", prompt: "If you could tell your past self one thing, what would it be?" },
  { category: "healing", prompt: "What's one thing you've forgiven yourself for?" },
  { category: "healing", prompt: "Write a letter to the person who hurt you (you don't have to send it)." },
  { category: "growth", prompt: "What's one small step you can take today toward feeling better?" },
  { category: "growth", prompt: "What boundary do you need to set for your own peace?" },
];

export const FREE_CHAT_LIMIT = 5;
export const PREMIUM_PRICE = 6.99;
