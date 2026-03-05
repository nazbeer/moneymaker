export interface MoodData {
  id: string;
  mood: number;
  note: string | null;
  tags: string[];
  createdAt: string;
}

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ChatSessionData {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessageData[];
}

export interface CommunityPostData {
  id: string;
  content: string;
  category: string;
  isAnonymous: boolean;
  createdAt: string;
  user: { name: string | null; image: string | null };
  reactions: { type: string; _count: number; userReacted: boolean }[];
  _count: { reactions: number };
}

export interface JournalEntryData {
  id: string;
  prompt: string;
  content: string;
  category: string;
  createdAt: string;
}

export interface UserStats {
  totalMoods: number;
  totalChats: number;
  totalJournals: number;
  currentStreak: number;
  longestStreak: number;
  avgMood: number;
  moodTrend: MoodData[];
}

export interface ExerciseData {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  steps: string[];
  isPremium: boolean;
}
