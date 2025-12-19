"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useRef } from "react";
import { useChat } from "ai/react";
import { cn } from "@/lib/utils/cn";
import { useStudio } from "../store/studio-store";
import { mergeChatMessages } from "../utils/conversation";
import { estimateTokens } from "../utils/tokens";
import ChatComposer from "./chat-composer";
import ChatTranscript from "./chat-transcript";

type ChatPanelProps = {
  className?: string;
};

export default function ChatPanel({ className }: ChatPanelProps) {
  const { state, actions } = useStudio();
  const { conversations, activeConversationId, settings } = state;
  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [conversations, activeConversationId],
  );
  const activeMessagesRef = useRef(activeConversation?.messages ?? []);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    setMessages,
    setInput,
    isLoading,
    stop,
  } = useChat({
    api: "/api/chat",
    body: {
      settings,
    },
    initialMessages:
      activeConversation?.messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
      })) ?? [],
  });

  useEffect(() => {
    activeMessagesRef.current = activeConversation?.messages ?? [];
  }, [activeConversation?.messages, activeConversation?.id]);

  useEffect(() => {
    stop();
    setMessages(
      activeMessagesRef.current.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
      })),
    );
    setInput("");
  }, [activeConversation?.id, setMessages, setInput, stop]);

  useEffect(() => {
    if (!activeConversation?.id) {
      return;
    }
    const nextMessages = mergeChatMessages(
      messages.map((message, index) => ({
        id: message.id ?? `${message.role}-${index}`,
        role: message.role,
        content: message.content,
      })),
      activeMessagesRef.current,
    );
    actions.updateConversationMessages(activeConversation.id, nextMessages);
  }, [messages, activeConversation?.id, actions]);

  const tokenEstimate = useMemo(
    () => estimateTokens(messages),
    [messages],
  );

  const handleComposerSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!input.trim()) {
      event.preventDefault();
      return;
    }
    if (!activeConversation) {
      actions.createConversation();
      setMessages([]);
    }
    handleSubmit(event);
  };

  return (
    <section
      className={cn(
        "flex h-full min-h-[320px] flex-col rounded-3xl border border-studio-border/80 bg-studio-panel/70 shadow-[0_35px_80px_rgba(6,8,12,0.45)] backdrop-blur animate-[float-in_0.7s_ease]",
        className,
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-studio-border/70 px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-studio-muted">Playground</p>
          <h2 className="text-lg font-semibold text-studio-text">
            {activeConversation?.title ?? "新对话"}
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-studio-muted">
          <span className="rounded-full border border-studio-border/70 px-3 py-1">
            {settings.model}
          </span>
          <span className="rounded-full border border-studio-border/70 px-3 py-1">
            tokens ~ {tokenEstimate}
          </span>
        </div>
      </header>

      <ChatTranscript messages={messages} isLoading={isLoading} />

      <ChatComposer
        input={input}
        onInputChange={handleInputChange}
        onSubmit={handleComposerSubmit}
        isLoading={isLoading}
        onStop={stop}
      />
    </section>
  );
}
