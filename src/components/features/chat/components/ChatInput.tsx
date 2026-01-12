"use client";

/**
 * ChatInput - 聊天输入区域组件
 * 
 * 包含：
 * - 多行文本输入框（自适应高度）
 * - 发送按钮 / 停止按钮（根据加载状态切换）
 * - 快捷键提示
 * 
 * 快捷键：
 * - Enter: 发送消息
 * - Shift + Enter: 换行
 */

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ChatPendingFile } from "../types";
import { Paperclip, Send, StopCircle, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

/** ChatInput 组件属性 */
interface ChatInputProps {
    /** 当前输入内容 */
    input: string;
    /** 是否处于加载状态 */
    isLoading: boolean;
    /** 输入变化回调 */
    onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    /** 键盘事件回调 */
    onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    /** 表单提交回调 */
    onSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
    /** 停止生成回调 */
    onStop: () => void;

    /** 已上传待发送附件 */
    attachments: ChatPendingFile[];
    /** 是否正在上传附件 */
    isUploadingAttachments: boolean;
    /** 添加文件（触发上传） */
    onAddFiles: (files: File[]) => void | Promise<void>;
    /** 移除单个附件 */
    onRemoveAttachment: (id: string) => void;
}

export function ChatInput({
    input,
    isLoading,
    onInputChange,
    onKeyDown,
    onSubmit,
    onStop,
    attachments,
    isUploadingAttachments,
    onAddFiles,
    onRemoveAttachment,
}: ChatInputProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const acceptFiles = useCallback(
        async (fileList: FileList | null) => {
            const files = fileList ? Array.from(fileList) : [];
            if (files.length === 0) return;
            await onAddFiles(files);
        },
        [onAddFiles]
    );

    const onDrop = useCallback(
        async (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            await acceptFiles(e.dataTransfer?.files ?? null);
        },
        [acceptFiles]
    );

    const onDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) setIsDragging(true);
    }, [isDragging]);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const to = e.relatedTarget as Node | null;
        if (to && e.currentTarget.contains(to)) return;
        setIsDragging(false);
    }, []);

    const onPaste = useCallback(
        async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
            if (isLoading || isUploadingAttachments) return;
            const items = e.clipboardData?.items;
            if (!items) return;
            const files: File[] = [];
            for (const item of items) {
                if (item.kind === "file") {
                    const f = item.getAsFile();
                    if (f) files.push(f);
                }
            }
            if (files.length > 0) {
                e.preventDefault();
                await onAddFiles(files);
            }
        },
        [isLoading, isUploadingAttachments, onAddFiles]
    );

    const canSend = (!isLoading && !isUploadingAttachments) && (input.trim().length > 0 || attachments.length > 0);

    return (
        <div
            className="p-4 border-t border-border bg-background"
            onDragEnter={onDragEnter}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            <form onSubmit={onSubmit} className="max-w-3xl mx-auto relative flex gap-2 items-end">
                <div className="relative flex-1">
                    {attachments.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                            {attachments.map((a) => (
                                <div
                                    key={a.id}
                                    className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-2 py-1 text-xs"
                                >
                                    {a.file.type.startsWith("image/") ? (
                                        <img
                                            src={a.previewUrl}
                                            alt={a.file.name}
                                            className="h-8 w-8 rounded object-cover border border-border/60"
                                        />
                                    ) : (
                                        <div className="h-8 w-8 rounded bg-background/40 border border-border/60 flex items-center justify-center text-muted-foreground">
                                            <Paperclip size={14} />
                                        </div>
                                    )}
                                    <div className="max-w-[220px] truncate" title={a.file.name}>
                                        {a.file.name}
                                    </div>
                                    <button
                                        type="button"
                                        className="text-muted-foreground hover:text-foreground"
                                        onClick={() => onRemoveAttachment(a.id)}
                                        aria-label="Remove attachment"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="relative">
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={async (e) => {
                                await acceptFiles(e.target.files);
                                e.currentTarget.value = "";
                            }}
                        />
                        <button
                            type="button"
                            className="absolute left-2 bottom-2 p-2 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading || isUploadingAttachments}
                            aria-label="Attach files"
                        >
                            <Paperclip size={16} />
                        </button>

                    <Textarea
                        value={input}
                        onChange={onInputChange}
                        onKeyDown={onKeyDown}
                        onPaste={onPaste}
                        placeholder="Type your message here..."
                        className="min-h-[50px] max-h-[200px] pl-12 pr-12 resize-none bg-secondary/50 border-transparent focus:border-primary/50"
                        rows={1}
                    />
                    </div>

                    {isUploadingAttachments && (
                        <div className="mt-2 text-xs text-muted-foreground">Uploading attachments…</div>
                    )}

                    {isDragging && (
                        <div className="absolute inset-0 rounded-md border-2 border-dashed border-primary/60 bg-background/60 backdrop-blur-sm flex items-center justify-center text-sm font-medium text-foreground">
                            Drop files to attach
                        </div>
                    )}
                </div>

                {isLoading ? (
                    <Button
                        type="button"
                        size="icon"
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={onStop}
                    >
                        <StopCircle size={18} />
                    </Button>
                ) : (
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!canSend}
                    >
                        <Send size={18} />
                    </Button>
                )}
            </form>
            <div className="text-center text-xs text-muted-foreground mt-2">
                Press Enter to send, Shift+Enter for new line
            </div>
        </div>
    );
}
