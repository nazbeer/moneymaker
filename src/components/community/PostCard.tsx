"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, MessageCircle } from "lucide-react";
import type { CommunityPostData } from "@/lib/types";
import { REACTION_TYPES, POST_CATEGORIES } from "@/lib/constants";

interface PostCardProps {
  post: CommunityPostData;
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function PostCard({ post }: PostCardProps) {
  const [reactions, setReactions] = useState(post.reactions);
  const [isReacting, setIsReacting] = useState(false);

  const category = POST_CATEGORIES.find((c) => c.value === post.category);

  const handleReaction = async (type: string) => {
    if (isReacting) return;
    setIsReacting(true);

    // Optimistic update
    setReactions((prev) => {
      const existing = prev.find((r) => r.type === type);
      if (existing) {
        if (existing.userReacted) {
          return prev.map((r) =>
            r.type === type
              ? { ...r, _count: r._count - 1, userReacted: false }
              : r
          );
        } else {
          return prev.map((r) =>
            r.type === type
              ? { ...r, _count: r._count + 1, userReacted: true }
              : r
          );
        }
      }
      return [...prev, { type, _count: 1, userReacted: true }];
    });

    try {
      await fetch(`/api/community/${post.id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
    } catch {
      // Revert on error
      setReactions(post.reactions);
    } finally {
      setIsReacting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all duration-200 hover:shadow-md">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
          {post.isAnonymous ? (
            <User className="w-5 h-5 text-purple-500" />
          ) : post.user.image ? (
            <img
              src={post.user.image}
              alt=""
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <User className="w-5 h-5 text-purple-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {post.isAnonymous ? "Anonymous" : post.user.name || "User"}
          </p>
          <p className="text-xs text-gray-400">{timeAgo(post.createdAt)}</p>
        </div>
        {category && (
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${category.color}`}
          >
            {category.label}
          </span>
        )}
      </div>

      {/* Content */}
      <p className="text-gray-700 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
        {post.content}
      </p>

      {/* Reactions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
        {REACTION_TYPES.map((reaction) => {
          const reactionData = reactions.find((r) => r.type === reaction.type);
          const count = reactionData?._count || 0;
          const userReacted = reactionData?.userReacted || false;

          return (
            <motion.button
              key={reaction.type}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleReaction(reaction.type)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                userReacted
                  ? "bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 ring-1 ring-purple-200"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
              title={reaction.label}
            >
              <span className="text-base">{reaction.emoji}</span>
              {count > 0 && (
                <span className="text-xs font-medium">{count}</span>
              )}
            </motion.button>
          );
        })}

        <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
          <MessageCircle className="w-3.5 h-3.5" />
          <span>{post._count.reactions}</span>
        </div>
      </div>
    </div>
  );
}
