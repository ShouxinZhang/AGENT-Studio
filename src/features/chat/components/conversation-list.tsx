"use client";

import { cn } from "@/lib/utils/cn";
import { useStudio } from "../store/studio-store";
import { getLastMessagePreview } from "../utils/conversation";

type ConversationListProps = {
  className?: string;
};

export default function ConversationList({ className }: ConversationListProps) {
  const { state, actions } = useStudio();
  const { conversations, activeConversationId } = state;

  return (
    <aside
      className={cn(
        "flex h-full min-h-[320px] flex-col rounded-3xl border border-studio-border/80 bg-studio-panel/80 p-4 shadow-[0_20px_60px_rgba(8,10,14,0.4)] backdrop-blur animate-[float-in_0.6s_ease]",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-studio-panel-2 text-sm font-semibold text-studio-accent shadow-[0_0_18px_var(--studio-glow)]">
          AS
        </div>
        <div>
          <p className="text-sm font-semibold text-studio-text">Agent Studio</p>
          <p className="text-xs text-studio-muted">Workspace</p>
        </div>
      </div>

      <button
        onClick={() => actions.createConversation()}
        className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-studio-border/80 bg-studio-panel-2/60 px-3 py-2 text-xs font-semibold text-studio-text transition hover:border-studio-accent/60 hover:text-studio-accent"
        type="button"
      >
        <span className="text-lg leading-none">+</span>
        新对话
      </button>

      <div className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-studio-muted">
        History
      </div>

      <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
        {conversations.map((conversation, index) => {
          const isActive = conversation.id === activeConversationId;
          return (
            <div
              key={conversation.id}
              style={{ animationDelay: `${index * 50}ms` }}
              className={cn(
                "group relative rounded-2xl border px-3 py-2 transition animate-[float-in_0.45s_ease]",
                isActive
                  ? "border-studio-accent/60 bg-studio-panel-2/80 shadow-[0_0_30px_rgba(60,209,167,0.15)]"
                  : "border-transparent bg-transparent hover:border-studio-border/80 hover:bg-studio-panel-2/50",
              )}
            >
              <button
                type="button"
                onClick={() => actions.setActiveConversation(conversation.id)}
                className="block w-full text-left"
              >
                <div className="text-sm font-semibold text-studio-text">
                  {conversation.title}
                </div>
                <div className="mt-1 text-xs text-studio-muted">
                  {getLastMessagePreview(conversation)}
                </div>
              </button>
              <button
                type="button"
                onClick={() => actions.deleteConversation(conversation.id)}
                className={cn(
                  "absolute right-2 top-2 rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-studio-muted opacity-0 transition hover:text-studio-danger group-hover:opacity-100",
                  isActive ? "opacity-100" : "",
                )}
                aria-label="删除对话"
              >
                删除
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-studio-border/60 bg-studio-panel-2/60 p-3 text-xs text-studio-muted">
        提示：在右侧设置系统提示词与模型参数，历史记录会自动保存在本地。
      </div>
    </aside>
  );
}
