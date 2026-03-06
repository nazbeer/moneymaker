"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ChatInterface from "@/components/chat/ChatInterface";
import {
  Plus,
  MessageCircle,
  Loader2,
  ChevronRight,
} from "lucide-react";
import type { ChatSessionData } from "@/lib/types";

export default function ChatPage() {
  const { status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSessionData[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch("/api/chat/sessions");
        if (res.ok) {
          const data = await res.json();
          setSessions(data);
        }
      } catch (error) {
        console.error("Failed to fetch chat sessions:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchSessions();
    }
  }, [status]);

  const handleNewChat = async () => {
    try {
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Conversation" }),
      });

      if (res.ok) {
        const newSession = await res.json();
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
      }
    } catch (error) {
      console.error("Failed to create chat session:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
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
      <div className="flex h-[calc(100vh-6rem)] -mt-2">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? "w-72" : "w-0"
          } transition-all duration-300 overflow-hidden border-r border-gray-200 bg-white flex-shrink-0 flex flex-col`}
        >
          <div className="p-4">
            <button
              onClick={handleNewChat}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium text-sm hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md shadow-purple-200 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No conversations yet
              </p>
            ) : (
              <div className="space-y-1">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setActiveSessionId(session.id)}
                    className={`w-full text-left px-3 py-3 rounded-xl text-sm transition-colors ${
                      activeSessionId === session.id
                        ? "bg-purple-50 text-purple-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate font-medium">
                        {session.title}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 ml-6">
                      {formatDate(session.createdAt)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Toggle sidebar */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex-shrink-0 w-6 flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <ChevronRight
            className={`w-4 h-4 text-gray-400 transition-transform ${
              sidebarOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeSessionId ? (
            <ChatInterface sessionId={activeSessionId} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Start a Conversation
                </h2>
                <p className="text-gray-500 mt-2 max-w-sm">
                  Talk to your AI companion about anything on your mind. Your
                  conversations are private and safe.
                </p>
                <button
                  onClick={handleNewChat}
                  className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium text-sm hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md shadow-purple-200"
                >
                  New Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
