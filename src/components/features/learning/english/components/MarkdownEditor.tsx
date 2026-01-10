"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Bold, Italic, Link2, Code, List, Heading2, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

type InsertMode = "wrap" | "prefixLine" | "insert";

function applyEdit(
  src: string,
  start: number,
  end: number,
  mode: InsertMode,
  a: string,
  b: string = ""
): { next: string; nextStart: number; nextEnd: number } {
  const before = src.slice(0, start);
  const sel = src.slice(start, end);
  const after = src.slice(end);

  if (mode === "wrap") {
    const next = `${before}${a}${sel || ""}${b}${after}`;
    const nextStart = start + a.length;
    const nextEnd = end + a.length;
    return { next, nextStart, nextEnd };
  }

  if (mode === "prefixLine") {
    // Prefix current line(s). Handles multi-line selection.
    const lineStart = before.lastIndexOf("\n") + 1;
    const selected = src.slice(lineStart, end);
    const lines = selected.split("\n");
    const nextLines = lines.map((l) => (l.trim().length === 0 ? l : `${a}${l}`));
    const next = `${src.slice(0, lineStart)}${nextLines.join("\n")}${after}`;
    return {
      next,
      nextStart: start + a.length,
      nextEnd: end + a.length * Math.max(1, lines.filter((l) => l.trim().length > 0).length),
    };
  }

  // insert
  const next = `${before}${a}${after}`;
  const nextPos = start + a.length;
  return { next, nextStart: nextPos, nextEnd: nextPos };
}

export function MarkdownEditor({
  value,
  onChange,
  disabled = false,
  className,
  placeholder,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const previewValue = useMemo(() => value || "", [value]);

  const runEdit = useCallback(
    (mode: InsertMode, a: string, b?: string) => {
      const el = textareaRef.current;
      if (!el) return;

      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? 0;

      const { next, nextStart, nextEnd } = applyEdit(value, start, end, mode, a, b);
      onChange(next);

      // Restore selection after React state update.
      requestAnimationFrame(() => {
        const el2 = textareaRef.current;
        if (!el2) return;
        el2.focus();
        el2.setSelectionRange(nextStart, nextEnd);
      });
    },
    [onChange, value]
  );

  const uploadImage = useCallback(
    async (file: File) => {
      if (disabled) return;
      setIsUploading(true);
      try {
        const form = new FormData();
        form.append("file", file);

        const res = await fetch("/api/learning/english/images", { method: "POST", body: form });
        if (!res.ok) {
          throw new Error(`upload failed: ${res.status}`);
        }
        const data = (await res.json()) as { url?: string; error?: string };
        if (!data.url) {
          throw new Error(data.error || "upload failed");
        }

        const el = textareaRef.current;
        const start = el?.selectionStart ?? value.length;
        const end = el?.selectionEnd ?? value.length;
        const alt = (file.name || "image").replace(/\.[^.]+$/, "");
        const md = `![${alt}](${data.url})`;

        const next = `${value.slice(0, start)}${md}${value.slice(end)}`;
        onChange(next);

        requestAnimationFrame(() => {
          const el2 = textareaRef.current;
          if (!el2) return;
          const pos = start + md.length;
          el2.focus();
          el2.setSelectionRange(pos, pos);
        });
      } finally {
        setIsUploading(false);
      }
    },
    [disabled, onChange, value]
  );

  const onPickImage = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      await uploadImage(file);
    },
    [uploadImage]
  );

  const onPaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (disabled) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file && file.type.startsWith("image/")) {
            e.preventDefault();
            await uploadImage(file);
            return;
          }
        }
      }
    },
    [disabled, uploadImage]
  );

  const onDrop = useCallback(
    async (e: React.DragEvent<HTMLTextAreaElement>) => {
      if (disabled) return;
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) return;
      e.preventDefault();
      await uploadImage(file);
    },
    [disabled, uploadImage]
  );

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          className="px-2 py-1 rounded-md text-xs border border-white/10 text-slate-300 hover:bg-white/5"
          onClick={() => runEdit("wrap", "**", "**")}
          disabled={disabled}
          title="Bold"
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded-md text-xs border border-white/10 text-slate-300 hover:bg-white/5"
          onClick={() => runEdit("wrap", "*", "*")}
          disabled={disabled}
          title="Italic"
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded-md text-xs border border-white/10 text-slate-300 hover:bg-white/5"
          onClick={() => runEdit("wrap", "`", "`")}
          disabled={disabled}
          title="Inline code"
        >
          <Code size={14} />
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded-md text-xs border border-white/10 text-slate-300 hover:bg-white/5"
          onClick={() => runEdit("insert", "\n\n````\n\n````\n")}
          disabled={disabled}
          title="Code block"
        >
          <span className="font-mono text-[11px]">```</span>
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded-md text-xs border border-white/10 text-slate-300 hover:bg-white/5"
          onClick={() => runEdit("prefixLine", "- ")}
          disabled={disabled}
          title="List"
        >
          <List size={14} />
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded-md text-xs border border-white/10 text-slate-300 hover:bg-white/5"
          onClick={() => runEdit("prefixLine", "## ")}
          disabled={disabled}
          title="Heading"
        >
          <Heading2 size={14} />
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded-md text-xs border border-white/10 text-slate-300 hover:bg-white/5"
          onClick={() => runEdit("wrap", "[", "](https://)")}
          disabled={disabled}
          title="Link"
        >
          <Link2 size={14} />
        </button>

        <button
          type="button"
          className="px-2 py-1 rounded-md text-xs border border-white/10 text-slate-300 hover:bg-white/5 disabled:opacity-50"
          onClick={onPickImage}
          disabled={disabled || isUploading}
          title="Upload image"
        >
          {isUploading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={onFileChange}
        />

        <div className="ml-auto text-[10px] text-slate-500">Left: edit · Right: preview</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={onPaste}
          onDragOver={(e) => {
            if (!disabled) e.preventDefault();
          }}
          onDrop={onDrop}
          disabled={disabled}
          className="w-full min-h-[260px] bg-transparent text-slate-200 outline-none resize-y text-sm leading-6 font-mono rounded-lg border border-white/10 p-3"
          placeholder={placeholder || "Write your note in Markdown..."}
        />

        <div className="min-h-[260px] rounded-lg border border-white/10 p-3 overflow-auto">
          <div className="prose prose-invert prose-indigo max-w-none select-text">
            <ReactMarkdown
              components={{
                h1: (props) => (
                  <h1 className="text-2xl font-bold text-white mb-4 border-b border-white/10 pb-2" {...props} />
                ),
                h2: (props) => <h2 className="text-xl font-semibold text-indigo-200 mt-6 mb-3" {...props} />,
                p: (props) => <p className="text-slate-300 leading-7 mb-4" {...props} />,
                blockquote: (props) => (
                  <blockquote
                    className="border-l-4 border-pink-500/50 pl-4 py-1 my-4 italic text-slate-400 bg-pink-500/5 rounded-r"
                    {...props}
                  />
                ),
                ul: (props) => <ul className="list-disc list-inside space-y-1 text-slate-300 mb-4" {...props} />,
                li: (props) => <li className="pl-2" {...props} />,
              }}
            >
              {previewValue}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
