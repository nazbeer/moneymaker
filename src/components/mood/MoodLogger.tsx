"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MOOD_EMOJIS, MOOD_TAGS } from "@/lib/constants";
import Button from "@/components/ui/Button";
import type { MoodData } from "@/lib/types";

export default function MoodLogger({ onMoodLogged }: { onMoodLogged?: (mood: MoodData) => void } = {}) {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (selectedMood === null) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: selectedMood,
          tags: selectedTags,
          note: note.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to log mood");

      setSubmitted(true);
      setTimeout(() => {
        setSelectedMood(null);
        setSelectedTags([]);
        setNote("");
        setSubmitted(false);
      }, 2000);
    } catch (error) {
      console.error("Error logging mood:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 10, stiffness: 200, delay: 0.1 }}
          className="text-5xl mb-4"
        >
          {MOOD_EMOJIS[selectedMood!]?.emoji}
        </motion.div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Mood Logged!
        </h3>
        <p className="text-gray-500 text-sm">
          Thank you for checking in with yourself today.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        How are you feeling?
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        Take a moment to check in with yourself.
      </p>

      {/* Mood selection */}
      <div className="flex justify-center gap-3 mb-6">
        {Object.entries(MOOD_EMOJIS).map(([key, { emoji, label }]) => {
          const value = Number(key);
          const isSelected = selectedMood === value;
          return (
            <motion.button
              key={key}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedMood(value)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                isSelected
                  ? "bg-gradient-to-r from-purple-100 to-indigo-100 ring-2 ring-purple-400 shadow-sm"
                  : "hover:bg-gray-50"
              }`}
            >
              <span className={`text-3xl ${isSelected ? "scale-110" : ""}`}>
                {emoji}
              </span>
              <span
                className={`text-xs font-medium ${
                  isSelected ? "text-purple-700" : "text-gray-500"
                }`}
              >
                {label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Tags */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">
          What&apos;s on your mind?
        </p>
        <div className="flex flex-wrap gap-2">
          {MOOD_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <motion.button
                key={tag}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isSelected
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tag}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Note */}
      <div className="mb-6">
        <label
          htmlFor="mood-note"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Add a note (optional)
        </label>
        <textarea
          id="mood-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write about how you're feeling..."
          rows={3}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-gray-400 resize-none"
        />
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        loading={isSubmitting}
        disabled={selectedMood === null}
        className="w-full"
        size="lg"
      >
        Log Mood
      </Button>
    </div>
  );
}
