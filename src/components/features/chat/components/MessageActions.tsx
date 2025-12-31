"use client";

/**
 * MessageActions - 消息操作按钮组件
 * 
 * 提供消息的交互操作按钮，分为两种变体：
 * - UserMessageActions: 用户消息操作（编辑、复制）
 * - AssistantMessageActions: AI 消息操作（复制、重新生成）
 * 
 * 设计特点：
 * - 用户消息按钮：hover 时显示，位于气泡下方
 * - AI 消息按钮：始终显示，位于气泡内部底部
 * - 使用 useChatUIStore 管理状态，避免 Props 钻取
 */

import { Button } from "@/components/ui/button";
import { Copy, Check, Pencil, RotateCcw } from "lucide-react";
import { memo } from "react";
import { useChatUIStore } from "@/lib/store/useChatUIStore";

/** 用户消息操作按钮属性 */
interface UserMessageActionsProps {
    /** 消息 ID */
    messageId: string;
    /** 消息文本内容 */
    messageText: string;
}

export const UserMessageActions = memo(function UserMessageActions({
    messageId,
    messageText,
}: UserMessageActionsProps) {
    const isCopied = useChatUIStore((s) => s.copiedId === messageId);
    const copyMessage = useChatUIStore((s) => s.copyMessage);
    const setEditing = useChatUIStore((s) => s.setEditing);

    return (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1 mr-1">
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                onClick={() => setEditing(messageId, "user", messageText)}
                title="Edit message"
                aria-label="Edit message"
            >
                <Pencil size={14} />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                onClick={() => copyMessage(messageId, messageText)}
                title="Copy message"
                aria-label="Copy message"
            >
                {isCopied ? <Check size={14} /> : <Copy size={14} />}
            </Button>
        </div>
    );
});

/** AI 消息操作按钮属性 */
interface AssistantMessageActionsProps {
    /** 消息 ID */
    messageId: string;
    /** 消息文本内容 */
    messageText: string;
    /** 重新生成回调 (仍然需要从父组件传入，因为它依赖于 useChat 实例) */
    onRegenerate: () => void;
}

export const AssistantMessageActions = memo(function AssistantMessageActions({
    messageId,
    messageText,
    onRegenerate,
}: AssistantMessageActionsProps) {
    const isCopied = useChatUIStore((s) => s.copiedId === messageId);
    const copyMessage = useChatUIStore((s) => s.copyMessage);
    const setEditing = useChatUIStore((s) => s.setEditing);

    return (
        <div className="flex items-center gap-1 mt-2 -ml-1">
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                onClick={() => setEditing(messageId, "assistant", messageText)}
                title="Edit assistant message"
                aria-label="Edit assistant message"
            >
                <Pencil size={14} />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                onClick={() => copyMessage(messageId, messageText)}
                title="Copy message"
                aria-label="Copy message"
            >
                {isCopied ? <Check size={14} /> : <Copy size={14} />}
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                onClick={onRegenerate}
                title="Regenerate"
                aria-label="Regenerate response"
            >
                <RotateCcw size={14} />
            </Button>
        </div>
    );
});
