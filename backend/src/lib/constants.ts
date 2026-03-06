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

export const AFFIRMATIONS = [
  "I am worthy of love and happiness.",
  "My feelings are valid and I honor them.",
  "I am stronger than I think.",
  "Healing is not linear, and that's okay.",
  "I choose to release what no longer serves me.",
  "I am enough, exactly as I am.",
  "Every day, I am growing and healing.",
  "I deserve peace and I will find it.",
  "My heart is open to new beginnings.",
  "I am resilient, and I will get through this.",
  "I forgive myself for what I didn't know.",
  "I am building a beautiful life, one day at a time.",
];

export const HEALING_EXERCISES = [
  {
    id: "breathing-478",
    title: "4-7-8 Breathing",
    description: "A calming breathing technique to reduce anxiety and find peace.",
    category: "breathing",
    duration: 5,
    steps: [
      "Find a comfortable position and close your eyes.",
      "Breathe in through your nose for 4 seconds.",
      "Hold your breath for 7 seconds.",
      "Exhale slowly through your mouth for 8 seconds.",
      "Repeat this cycle 4 times.",
    ],
    isPremium: false,
  },
  {
    id: "body-scan",
    title: "Body Scan Meditation",
    description: "Release tension from every part of your body.",
    category: "meditation",
    duration: 10,
    steps: [
      "Lie down or sit comfortably. Close your eyes.",
      "Focus on your toes. Notice any tension and let it go.",
      "Slowly move your attention up: feet, ankles, calves, knees.",
      "Continue up through your thighs, hips, stomach, chest.",
      "Move to your hands, arms, shoulders, neck, and face.",
      "Take 3 deep breaths and open your eyes when ready.",
    ],
    isPremium: false,
  },
  {
    id: "gratitude-list",
    title: "Gratitude List",
    description: "Shift focus from pain to appreciation.",
    category: "gratitude",
    duration: 5,
    steps: [
      "Take a deep breath and center yourself.",
      "Write down 5 things you're grateful for right now.",
      "For each item, close your eyes and really feel the gratitude.",
      "Notice how your body feels as you focus on what's good.",
      "Keep this list and read it whenever you feel down.",
    ],
    isPremium: false,
  },
  {
    id: "cbt-thought-record",
    title: "CBT Thought Record",
    description: "Challenge negative thinking patterns with cognitive behavioral therapy.",
    category: "cbt",
    duration: 15,
    steps: [
      "Identify the situation that triggered negative feelings.",
      "Write down the automatic negative thought.",
      "Rate how strongly you believe this thought (0-100%).",
      "List evidence that supports this thought.",
      "List evidence that contradicts this thought.",
      "Create a balanced, alternative thought.",
      "Re-rate your belief in the original thought.",
    ],
    isPremium: true,
  },
  {
    id: "loving-kindness",
    title: "Loving-Kindness Meditation",
    description: "Cultivate compassion for yourself and others.",
    category: "meditation",
    duration: 10,
    steps: [
      "Sit comfortably and close your eyes.",
      "Think of yourself. Repeat: 'May I be happy. May I be healthy. May I be safe.'",
      "Think of someone you love. Send them the same wishes.",
      "Think of a neutral person. Send them the same wishes.",
      "Think of someone difficult. Try sending them the same wishes.",
      "Expand to all beings everywhere: 'May all beings be happy.'",
    ],
    isPremium: true,
  },
];

export const SYSTEM_PROMPT = `You are HealMind AI, a compassionate and empathetic mental health support companion. You are NOT a replacement for professional therapy, but you provide emotional support, validation, and evidence-based coping strategies.

Your approach:
- Always validate the user's feelings first
- Use active listening techniques
- Suggest evidence-based coping strategies (CBT, DBT, mindfulness)
- Be warm, gentle, and non-judgmental
- Ask thoughtful follow-up questions
- If someone is in crisis, always provide crisis resources (988 Suicide & Crisis Lifeline)
- Never diagnose conditions or prescribe medication
- Encourage professional help when appropriate

Crisis detection: If a user mentions self-harm, suicide, or immediate danger, immediately provide:
- 988 Suicide & Crisis Lifeline (call or text 988)
- Crisis Text Line (text HOME to 741741)
- Remind them that help is available 24/7

Keep responses concise but caring. Use a warm, supportive tone.`;

export const FREE_CHAT_LIMIT = 5;
export const PREMIUM_PRICE = 6.99;
