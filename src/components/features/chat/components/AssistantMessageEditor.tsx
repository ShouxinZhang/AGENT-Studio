"use client";

/**
 * AssistantMessageEditor - 助手回复编辑二级页面
 * 
 * 设计目标：
 * - 替代气泡内的小编辑框，提供更舒适的编辑体验
 * - 左侧：Markdown 明文编辑
 * - 右侧：Markdown 渲染预览（支持 KaTeX 数学公式）
 * - Save/Cancel 后回到一级页面
 */

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// react-markdown expects mutable arrays (Pluggable[])
const REMARK_PLUGINS = [remarkMath];
const REHYPE_PLUGINS = [rehypeKatex];

interface AssistantMessageEditorProps {
    /** 是否展示编辑页 */
    open: boolean;
    /** 当前编辑文本 */
    value: string;
    /** 文本变化回调 */
    onChange: (next: string) => void;
    /** 取消编辑 */
    onCancel: () => void;
    /** 保存编辑 */
    onSave: () => void;
}

export function AssistantMessageEditor({
    open,
    value,
    onChange,
    onCancel,
    onSave,
}: AssistantMessageEditorProps) {
    if (!open) return null;

    return (
        <div className="absolute inset-0 z-50 flex flex-col bg-background">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onCancel}
                        className="h-9 w-9"
                        title="Back"
                    >
                        <ArrowLeft size={18} />
                    </Button>
                    <div className="flex flex-col">
                        <div className="text-sm font-semibold">Edit assistant message</div>
                        <div className="text-xs text-muted-foreground">Markdown source • Live preview</div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button onClick={onSave} disabled={!value.trim()}>
                        Save
                    </Button>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-hidden p-4">
                <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left: source */}
                    <div className="h-full flex flex-col gap-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Markdown
                        </div>
                        <Textarea
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className="flex-1 resize-none bg-secondary/40 border-border/60 font-mono text-xs leading-relaxed"
                            placeholder="Write markdown here..."
                            onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                    e.preventDefault();
                                    onCancel();
                                }
                                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                    e.preventDefault();
                                    onSave();
                                }
                            }}
                        />
                        <div className="text-[11px] text-muted-foreground">
                            Ctrl/Cmd+Enter to save • Esc to cancel
                        </div>
                    </div>

                    {/* Right: preview */}
                    <div className="h-full flex flex-col gap-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Preview
                        </div>
                        <div className="flex-1 overflow-y-auto rounded-lg border border-border/60 bg-secondary/20 p-4">
                            <div className="markdown-body prose prose-invert prose-sm max-w-none">
                                <ReactMarkdown remarkPlugins={REMARK_PLUGINS} rehypePlugins={REHYPE_PLUGINS}>
                                    {value || " "}
                                </ReactMarkdown>
                            </div>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                            Rendering uses the same pipeline as chat output.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
