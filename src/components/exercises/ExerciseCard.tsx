"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronDown, Crown, Sparkles } from "lucide-react";
import type { ExerciseData } from "@/lib/types";

interface ExerciseCardProps {
  exercise: ExerciseData;
  isPremiumUser?: boolean;
}

const categoryColors: Record<string, string> = {
  breathing: "bg-blue-100 text-blue-700",
  meditation: "bg-purple-100 text-purple-700",
  gratitude: "bg-green-100 text-green-700",
  cbt: "bg-amber-100 text-amber-700",
  journaling: "bg-pink-100 text-pink-700",
};

export default function ExerciseCard({
  exercise,
  isPremiumUser = false,
}: ExerciseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isLocked = exercise.isPremium && !isPremiumUser;
  const categoryColor =
    categoryColors[exercise.category] || "bg-gray-100 text-gray-700";

  return (
    <motion.div
      layout
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 ${
        isLocked
          ? "opacity-75 hover:opacity-100"
          : "hover:shadow-md hover:border-gray-200"
      }`}
    >
      <div
        onClick={() => !isLocked && setIsExpanded(!isExpanded)}
        className={`p-6 ${isLocked ? "cursor-default" : "cursor-pointer"}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${categoryColor}`}
              >
                {exercise.category}
              </span>
              {exercise.isPremium && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700">
                  <Crown className="w-3 h-3" />
                  Premium
                </span>
              )}
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {exercise.title}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              {exercise.description}
            </p>

            <div className="flex items-center gap-1.5 mt-3 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{exercise.duration} min</span>
            </div>
          </div>

          {!isLocked && (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 p-2 rounded-lg bg-gray-50 text-gray-400"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          )}

          {isLocked && (
            <div className="flex-shrink-0 p-2 rounded-lg bg-gradient-to-r from-purple-100 to-indigo-100">
              <Crown className="w-4 h-4 text-purple-600" />
            </div>
          )}
        </div>
      </div>

      {/* Expanded steps */}
      <AnimatePresence>
        {isExpanded && !isLocked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <h4 className="text-sm font-semibold text-gray-900">Steps</h4>
              </div>
              <ol className="space-y-3">
                {exercise.steps.map((step, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="flex gap-3"
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-medium flex items-center justify-center mt-0.5">
                      {index + 1}
                    </span>
                    <p className="text-sm text-gray-600 leading-relaxed pt-0.5">
                      {step}
                    </p>
                  </motion.li>
                ))}
              </ol>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Locked overlay message */}
      {isLocked && (
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100">
            <Crown className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <p className="text-sm text-purple-700">
              Upgrade to Premium to unlock this exercise.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
