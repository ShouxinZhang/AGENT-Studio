"use client";

import type { ChangeEvent, FormEvent } from "react";
import { cn } from "@/lib/utils/cn";

type ChatComposerProps = {
  input: string;
  isLoading: boolean;
  onInputChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onStop: () => void;
};

export default function ChatComposer({
  input,
  isLoading,
  onInputChange,
  onSubmit,
  onStop,
}: ChatComposerProps) {
  return (
    <form onSubmit={onSubmit} className="border-t border-studio-border/70 px-6 py-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-studio-border/70 bg-studio-panel-2/80 p-3">
        <textarea
          value={input}
          onChange={onInputChange}
          placeholder="输入你的提示，Shift + Enter 换行"
          rows={3}
          className="min-h-[90px] w-full resize-none bg-transparent text-sm leading-6 text-studio-text outline-none placeholder:text-studio-muted"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              (event.currentTarget.form ?? event.currentTarget.closest("form"))?.requestSubmit();
            }
          }}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-studio-muted">支持 Markdown / 可在设置中调整系统指令</div>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <button
                type="button"
                onClick={onStop}
                className="rounded-full border border-studio-border/70 px-4 py-1.5 text-xs font-semibold text-studio-muted transition hover:border-studio-danger/60 hover:text-studio-danger"
              >
                停止
              </button>
            ) : null}
            <button
              type="submit"
              className={cn(
                "rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition",
                isLoading
                  ? "bg-studio-border text-studio-muted"
                  : "bg-studio-accent text-studio-bg shadow-[0_0_20px_rgba(60,209,167,0.35)] hover:translate-y-[-1px]",
              )}
              disabled={isLoading}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
