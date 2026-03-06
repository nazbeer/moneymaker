import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { apiFetch, apiStreamFetch } from "../lib/api";
import { COLORS } from "../lib/constants";
import type { ChatSession, ChatMessage } from "../lib/types";

export default function ChatScreen() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      const data = await apiFetch<ChatSession[]>("/api/chat");
      setSessions(data);
    } catch {
      // ignore
    }
  }

  async function loadSession(sessionId: string) {
    try {
      const data = await apiFetch<{ messages: ChatMessage[] }>(`/api/chat/${sessionId}`);
      setMessages(data.messages);
      setActiveSessionId(sessionId);
      setShowSessions(false);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  }

  function startNewChat() {
    setActiveSessionId(null);
    setMessages([]);
    setShowSessions(false);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      const res = await apiStreamFetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: text,
          sessionId: activeSessionId || undefined,
        }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream available");

      const decoder = new TextDecoder();
      let assistantContent = "";
      let sessionId = activeSessionId;

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                assistantContent += data.content;
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last.role === "assistant") {
                    updated[updated.length - 1] = { ...last, content: assistantContent };
                  }
                  return updated;
                });
              }
              if (data.sessionId && !sessionId) {
                sessionId = data.sessionId;
                setActiveSessionId(sessionId);
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
      }

      loadSessions();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSending(false);
    }
  }

  async function deleteSession(sessionId: string) {
    try {
      await apiFetch(`/api/chat/${sessionId}`, { method: "DELETE" });
      if (activeSessionId === sessionId) startNewChat();
      loadSessions();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  }

  if (showSessions) {
    return (
      <View style={styles.container}>
        <View style={styles.sessionsHeader}>
          <Text style={styles.sessionsTitle}>Chat History</Text>
          <TouchableOpacity onPress={() => setShowSessions(false)}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.newChatButton} onPress={startNewChat}>
          <Text style={styles.newChatText}>+ New Chat</Text>
        </TouchableOpacity>
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.sessionItem, item.id === activeSessionId && styles.sessionItemActive]}
              onPress={() => loadSession(item.id)}
              onLongPress={() =>
                Alert.alert("Delete Chat?", "This cannot be undone.", [
                  { text: "Cancel" },
                  { text: "Delete", style: "destructive", onPress: () => deleteSession(item.id) },
                ])
              }
            >
              <Text style={styles.sessionTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.sessionMeta}>{item._count?.messages ?? 0} messages</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No chats yet</Text>}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={() => setShowSessions(true)}>
          <Text style={styles.historyButton}>History</Text>
        </TouchableOpacity>
        <Text style={styles.chatTitle}>AI Therapist</Text>
        <TouchableOpacity onPress={startNewChat}>
          <Text style={styles.historyButton}>New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.messageList}
        contentContainerStyle={styles.messageContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        renderItem={({ item }) => (
          <View style={[styles.messageBubble, item.role === "user" ? styles.userBubble : styles.assistantBubble]}>
            <Text style={[styles.messageText, item.role === "user" && styles.userText]}>
              {item.content}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatEmoji}>💬</Text>
            <Text style={styles.emptyChatTitle}>Start a Conversation</Text>
            <Text style={styles.emptyChatSub}>
              I'm here to listen, support, and help you on your healing journey.
            </Text>
          </View>
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.chatInput}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.textTertiary}
          value={input}
          onChangeText={setInput}
          multiline
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendText}>↑</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  chatTitle: { fontSize: 17, fontWeight: "600", color: COLORS.text },
  historyButton: { fontSize: 15, color: COLORS.primary, fontWeight: "600" },
  messageList: { flex: 1 },
  messageContent: { padding: 16, paddingBottom: 8 },
  messageBubble: { maxWidth: "80%", padding: 12, borderRadius: 16, marginBottom: 8 },
  userBubble: { alignSelf: "flex-end", backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  assistantBubble: { alignSelf: "flex-start", backgroundColor: COLORS.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border },
  messageText: { fontSize: 15, lineHeight: 22, color: COLORS.text },
  userText: { color: "#fff" },
  inputRow: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "flex-end",
    gap: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: { opacity: 0.4 },
  sendText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  emptyChat: { alignItems: "center", marginTop: 80, padding: 40 },
  emptyChatEmoji: { fontSize: 48, marginBottom: 16 },
  emptyChatTitle: { fontSize: 20, fontWeight: "600", color: COLORS.text, marginBottom: 8 },
  emptyChatSub: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center", lineHeight: 20 },
  // Sessions
  sessionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sessionsTitle: { fontSize: 20, fontWeight: "700", color: COLORS.text },
  closeText: { fontSize: 15, color: COLORS.primary, fontWeight: "600" },
  newChatButton: {
    margin: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    alignItems: "center",
  },
  newChatText: { color: COLORS.primary, fontWeight: "600" },
  sessionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sessionItemActive: { backgroundColor: COLORS.primary + "10" },
  sessionTitle: { fontSize: 15, fontWeight: "500", color: COLORS.text },
  sessionMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  emptyText: { textAlign: "center", color: COLORS.textSecondary, marginTop: 40 },
});
