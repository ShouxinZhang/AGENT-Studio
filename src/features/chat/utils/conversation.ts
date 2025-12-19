import type { ChatMessage, Conversation } from "../store/types";

export function deriveTitle(messages: ChatMessage[]) {
  const firstUser = messages.find((message) => message.role === "user");
  if (!firstUser) {
    return "新对话";
  }
  const cleaned = firstUser.content.replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return "新对话";
  }
  return cleaned.length > 24 ? `${cleaned.slice(0, 24)}…` : cleaned;
}

export function getLastMessagePreview(conversation: Conversation) {
  const last = [...conversation.messages].reverse().find((message) => message.role !== "system");
  if (!last) {
    return "等待新的提示…";
  }
  const cleaned = last.content.replace(/\s+/g, " ").trim();
  return cleaned.length > 40 ? `${cleaned.slice(0, 40)}…` : cleaned;
}

export function sortConversations(conversations: Conversation[]) {
  return [...conversations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function mergeChatMessages(
  incoming: Array<Pick<ChatMessage, "id" | "role" | "content">>,
  existing: ChatMessage[],
) {
  const existingMap = new Map(existing.map((message) => [message.id, message]));
  const now = new Date().toISOString();
  return incoming.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: existingMap.get(message.id)?.createdAt ?? now,
  }));
}
