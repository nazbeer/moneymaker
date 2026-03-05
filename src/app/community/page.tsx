"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CreatePostForm from "@/components/community/CreatePostForm";
import PostCard from "@/components/community/PostCard";
import { Loader2, Users } from "lucide-react";
import type { CommunityPostData } from "@/lib/types";
import { POST_CATEGORIES } from "@/lib/constants";

export default function CommunityPage() {
  const { status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<CommunityPostData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const fetchPosts = async (pageNum: number, category: string, append = false) => {
    try {
      const categoryParam = category !== "all" ? `&category=${category}` : "";
      const res = await fetch(
        `/api/community/posts?page=${pageNum}&limit=10${categoryParam}`
      );
      if (res.ok) {
        const data = await res.json();
        if (append) {
          setPosts((prev) => [...prev, ...data.posts]);
        } else {
          setPosts(data.posts);
        }
        setHasMore(data.hasMore ?? data.posts.length === 10);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    }
  };

  useEffect(() => {
    async function loadPosts() {
      setIsLoading(true);
      await fetchPosts(1, activeCategory);
      setIsLoading(false);
      setPage(1);
    }

    if (status === "authenticated") {
      loadPosts();
    }
  }, [status, activeCategory]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    const nextPage = page + 1;
    await fetchPosts(nextPage, activeCategory, true);
    setPage(nextPage);
    setIsLoadingMore(false);
  };

  const handlePostCreated = (newPost: CommunityPostData) => {
    setPosts((prev) => [newPost, ...prev]);
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
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Community</h1>
          <p className="text-gray-500 mt-1">
            Share your journey, support others, and heal together
          </p>
        </div>

        {/* Create Post */}
        <CreatePostForm onPostCreated={handlePostCreated} />

        {/* Category Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeCategory === "all"
                ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            All
          </button>
          {POST_CATEGORIES.map((cat) => (
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

        {/* Posts Feed */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">
              No posts yet. Be the first to share!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-6 py-3 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {isLoadingMore ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Load More"
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
