"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MoodLogger from "@/components/mood/MoodLogger";
import MoodChart from "@/components/mood/MoodChart";
import { Loader2, Calendar } from "lucide-react";
import type { MoodData } from "@/lib/types";
import { MOOD_EMOJIS } from "@/lib/constants";

export default function MoodPage() {
  const { status } = useSession();
  const router = useRouter();
  const [moods, setMoods] = useState<MoodData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchMoods() {
      try {
        const res = await fetch("/api/moods");
        if (res.ok) {
          const data = await res.json();
          setMoods(data);
        }
      } catch (error) {
        console.error("Failed to fetch moods:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchMoods();
    }
  }, [status]);

  const handleMoodLogged = (newMood: MoodData) => {
    setMoods((prev) => [newMood, ...prev]);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (status === "loading") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mood Tracker</h1>
          <p className="text-gray-500 mt-1">
            Track how you&apos;re feeling and discover patterns over time
          </p>
        </div>

        {/* Mood Logger */}
        <MoodLogger onMoodLogged={handleMoodLogged} />

        {/* Mood Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Your Mood Over Time
          </h2>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <MoodChart data={moods} />
          )}
        </div>

        {/* Recent Entries */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Entries
          </h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : moods.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No mood entries yet. Log your first mood above!
            </p>
          ) : (
            <div className="space-y-3">
              {moods.slice(0, 10).map((mood) => (
                <div
                  key={mood.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="text-3xl">
                    {MOOD_EMOJIS[mood.mood]?.emoji ?? "?"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {MOOD_EMOJIS[mood.mood]?.label ?? "Unknown"}
                      </span>
                      {mood.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {mood.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {mood.note && (
                      <p className="text-sm text-gray-500 mt-0.5 truncate">
                        {mood.note}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                    <Calendar className="w-3 h-3" />
                    {formatDate(mood.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
