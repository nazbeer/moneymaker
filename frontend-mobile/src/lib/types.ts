export interface User {
  id: string;
  name: string | null;
  email: string;
  isPremium: boolean;
  image?: string | null;
  createdAt?: string;
}

export interface MoodEntry {
  id: string;
  mood: number;
  note: string | null;
  tags: string[];
  createdAt: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  prompt: string;
  content: string;
  category: string | null;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  content: string;
  category: string;
  isAnonymous: boolean;
  createdAt: string;
  user: { name: string | null };
  reactions: ReactionCount[];
  userReacted?: string[];
}

export interface ReactionCount {
  type: string;
  count: number;
}

export interface DashboardData {
  totalMoods: number;
  totalChats: number;
  totalJournals: number;
  currentStreak: number;
  longestStreak: number;
  avgMood: number;
  moodTrend: { mood: number; createdAt: string }[];
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  steps: string[];
  isPremium: boolean;
  isLocked?: boolean;
}

export interface PaginatedResponse<T> {
  entries?: T[];
  posts?: T[];
  total: number;
  page: number;
  totalPages: number;
}
