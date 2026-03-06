"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ExerciseCard from "@/components/exercises/ExerciseCard";
import { Loader2 } from "lucide-react";
import { HEALING_EXERCISES } from "@/lib/constants";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "breathing", label: "Breathing" },
  { value: "meditation", label: "Meditation" },
  { value: "gratitude", label: "Gratitude" },
  { value: "cbt", label: "CBT" },
];

export default function ExercisesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const filteredExercises =
    activeCategory === "all"
      ? HEALING_EXERCISES
      : HEALING_EXERCISES.filter((ex) => ex.category === activeCategory);

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
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Healing Exercises
          </h1>
          <p className="text-gray-500 mt-1">
            Evidence-based exercises to support your mental well-being
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeCategory === cat.value
                  ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Exercise Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))}
        </div>

        {filteredExercises.length === 0 && (
          <p className="text-center text-gray-400 py-12">
            No exercises found in this category.
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
