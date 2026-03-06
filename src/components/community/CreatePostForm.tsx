"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Eye, EyeOff, ChevronDown } from "lucide-react";
import { POST_CATEGORIES } from "@/lib/constants";
import Button from "@/components/ui/Button";

interface CreatePostFormProps {
  onPostCreated?: () => void;
}

export default function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const selectedCategory = POST_CATEGORIES.find((c) => c.value === category);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !category) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          category,
          isAnonymous,
        }),
      });

      if (!res.ok) throw new Error("Failed to create post");

      setContent("");
      setCategory("");
      setIsAnonymous(true);
      onPostCreated?.();
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        Share with the Community
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Your voice matters. Share your story or offer support.
      </p>

      {/* Textarea */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind? Share your thoughts, experiences, or words of encouragement..."
        rows={4}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-gray-400 resize-none mb-4"
        maxLength={1000}
      />

      {/* Options row */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Category selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {selectedCategory ? (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${selectedCategory.color}`}>
                {selectedCategory.label}
              </span>
            ) : (
              <span className="text-gray-400">Select category</span>
            )}
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {showCategoryDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10"
            >
              {POST_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => {
                    setCategory(cat.value);
                    setShowCategoryDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                    category === cat.value ? "bg-purple-50" : ""
                  }`}
                >
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cat.color}`}>
                    {cat.label}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Anonymous toggle */}
        <button
          type="button"
          onClick={() => setIsAnonymous(!isAnonymous)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            isAnonymous
              ? "bg-purple-100 text-purple-700 border border-purple-200"
              : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
          }`}
        >
          {isAnonymous ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
          {isAnonymous ? "Anonymous" : "Public"}
        </button>
      </div>

      {/* Character count and submit */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {content.length}/1000 characters
        </span>
        <Button
          type="submit"
          loading={isSubmitting}
          disabled={!content.trim() || !category}
          size="md"
        >
          <Send className="w-4 h-4 mr-2" />
          Share Post
        </Button>
      </div>
    </form>
  );
}
