"use client";

import { cn } from "@/lib/utils/cn";

type ChatTranscriptProps = {
  messages: Array<{
    id?: string;
    role: "assistant" | "user" | "system";
    content: string;
    createdAt?: string | Date;
  }>;
  isLoading: boolean;
};

const formatTimestamp = (value?: string | Date) => {
  if (!value) {
    return "刚刚";
  }
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export default function ChatTranscript({ messages, isLoading }: ChatTranscriptProps) {
  if (!messages.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <div className="max-w-sm rounded-3xl border border-dashed border-studio-border/70 bg-studio-panel-2/40 p-6">
          <p className="text-sm text-studio-text">开始一个新的对话</p>
          <p className="mt-2 text-xs text-studio-muted">
            试试输入目标、角色或约束条件，让模型为你构建可执行的方案。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
      {messages.map((message, index) => {
        const isUser = message.role === "user";
        const isAssistant = message.role === "assistant";
        const isSystem = message.role === "system";
        if (isSystem) {
          return null;
        }
        return (
          <div
            key={message.id ?? `${message.role}-${index}`}
            className={cn(
              "rounded-2xl border px-5 py-4",
              isUser
                ? "border-studio-accent/60 bg-studio-panel-2/70 shadow-[0_0_25px_rgba(60,209,167,0.12)]"
                : "border-studio-border/70 bg-studio-panel/70",
            )}
          >
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-studio-muted">
              <span className={cn(isAssistant ? "text-studio-accent-2" : "text-studio-accent")}>
                {isAssistant ? "Model" : "User"}
              </span>
              <span>{formatTimestamp(message.createdAt)}</span>
            </div>
            <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-studio-text">
              {message.content}
            </div>
          </div>
        );
      })}
      {isLoading ? (
        <div className="rounded-2xl border border-studio-border/70 bg-studio-panel/70 px-5 py-4 text-xs text-studio-muted">
          模型正在输出中…
        </div>
      ) : null}
    </div>
  );
}
