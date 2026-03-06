"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MoodChart from "@/components/mood/MoodChart";
import {
  Flame,
  Brain,
  MessageCircle,
  BookOpen,
  Sparkles,
  TrendingUp,
  Loader2,
  SmilePlus,
  Dumbbell,
} from "lucide-react";
import type { UserStats } from "@/lib/types";
import { AFFIRMATIONS } from "@/lib/constants";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [affirmation, setAffirmation] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * AFFIRMATIONS.length);
    setAffirmation(AFFIRMATIONS[randomIndex]);
  }, []);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchStats();
    }
  }, [status]);

  if (status === "loading" || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </DashboardLayout>
    );
  }

  const userName = session?.user?.name?.split(" ")[0] || "Friend";

  const statCards = [
    {
      label: "Current Streak",
      value: `${stats?.currentStreak ?? 0} days`,
      icon: Flame,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      label: "Avg Mood",
      value: stats?.avgMood ? stats.avgMood.toFixed(1) : "—",
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      label: "Total Chats",
      value: stats?.totalChats ?? 0,
      icon: MessageCircle,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "Journal Entries",
      value: stats?.totalJournals ?? 0,
      icon: BookOpen,
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
  ];

  const quickActions = [
    {
      label: "Log Mood",
      icon: SmilePlus,
      href: "/mood",
      color: "from-pink-500 to-rose-500",
    },
    {
      label: "Start Chat",
      icon: MessageCircle,
      href: "/chat",
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "Journal",
      icon: BookOpen,
      href: "/journal",
      color: "from-purple-500 to-indigo-500",
    },
    {
      label: "Exercises",
      icon: Dumbbell,
      href: "/exercises",
      color: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {userName}
          </h1>
          <p className="text-gray-500 mt-1">
            Here&apos;s how your healing journey is going
          </p>
        </div>

        {/* Daily Affirmation */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-purple-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-purple-100">
                Daily Affirmation
              </p>
              <p className="text-lg font-semibold mt-1">{affirmation}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
            >
              <div
                className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}
              >
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Mood Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Mood Trend</h2>
          </div>
          <MoodChart data={stats?.moodTrend ?? []} />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => router.push(action.href)}
                className={`bg-gradient-to-r ${action.color} rounded-2xl p-5 text-white text-left hover:opacity-90 transition-opacity shadow-md`}
              >
                <action.icon className="w-6 h-6 mb-3" />
                <p className="font-semibold">{action.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Healing Streak */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Healing Streak
              </h2>
            </div>
            <span className="text-sm text-gray-500">
              Longest: {stats?.longestStreak ?? 0} days
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-orange-400 to-orange-600 h-4 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(((stats?.currentStreak ?? 0) / Math.max(stats?.longestStreak ?? 1, 1)) * 100, 100)}%`,
              }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {stats?.currentStreak ?? 0} day streak — keep going!
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
