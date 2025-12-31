"use client";

/**
 * MessageBubble - 消息气泡组件
 * 
 * 渲染单条聊天消息，支持：
 * - 用户消息：纯文本显示、编辑模式
 * - AI 消息：Markdown 渲染、数学公式（KaTeX）、思考过程展示
 * - 头像显示
 * - 操作按钮（复制、编辑、重新生成）
 * 
 * 重构说明：
 * - 引入 useChatUIStore 管理交互状态，减少 Props 钻取
 * - 提取 AssistantMessageContent 独立组件
 */

import type { UIMessage } from "ai";
import { Bot, User, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getMessageText } from "../hooks/useChatLogic";
import { UserMessageActions, AssistantMessageActions } from "./MessageActions";
import { AssistantMessageContent } from "./AssistantMessageContent";
import { memo } from "react";
import { useChatUIStore } from "@/lib/store/useChatUIStore";

/** MessageBubble 组件属性 */
interface MessageBubbleProps {
    /** 消息对象（AI SDK UIMessage 类型） */
    message: UIMessage;
    /** 是否为最后一条消息（用于判断流式输出状态） */
    isLastMessage: boolean;
    /** 是否正在流式输出 */
    isStreaming: boolean;
    /** 是否处于加载状态 */
    isLoading: boolean;
    /** 保存编辑回调 (需要触发 useChat 的 regenerate) */
    onSaveEdit: () => void;
    /** 重新生成回调 */
    onRegenerate: () => void;
}

export const MessageBubble = memo(function MessageBubble({
    message,
    isLastMessage,
    isStreaming,
    isLoading,
    onSaveEdit,
    onRegenerate,
}: MessageBubbleProps) {
    const messageText = getMessageText(message);
    const isUser = message.role === "user";
    
    // Selectors: 只订阅当前消息相关的状态
    const isEditing = useChatUIStore((s) => s.editingId === message.id);
    const editingRole = useChatUIStore((s) => s.editingRole);
    
    // 助手消息编辑状态判断
    const isAssistantEditingThis = isEditing && editingRole === "assistant";

    return (
        <div
            className={cn(
                "flex gap-4 max-w-3xl mx-auto w-full group",
                isUser ? "justify-end" : "justify-start"
            )}
        >
            {/* Assistant Avatar */}
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary">
                    <Bot size={18} />
                </div>
            )}

            <div className={cn("flex flex-col max-w-[85%]", isUser ? "items-end" : "items-start")}>
                <div
                    className={cn(
                        "rounded-lg px-4 py-3 text-sm leading-relaxed relative",
                        isUser
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-transparent text-foreground"
                    )}
                >
                    {isUser ? (
                        <UserMessageContent
                            messageText={messageText}
                            isEditing={isEditing}
                            onSaveEdit={onSaveEdit}
                        />
                    ) : (
                        <AssistantMessageContent
                            message={message}
                            isLastMessage={isLastMessage}
                            isStreaming={isStreaming}
                        />
                    )}

                    {/* Assistant Actions (inside bubble) */}
                    {!isUser && !isLoading && !isAssistantEditingThis && (
                        <AssistantMessageActions
                            messageId={message.id}
                            messageText={messageText}
                            onRegenerate={onRegenerate}
                        />
                    )}
                </div>

                {/* User Actions (below bubble) */}
                {isUser && !isLoading && !isEditing && (
                    <UserMessageActions
                        messageId={message.id}
                        messageText={messageText}
                    />
                )}
            </div>

            {/* User Avatar */}
            {isUser && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User size={18} />
                </div>
            )}
        </div>
    );
});

/**
 * 用户消息内容组件
 */
function UserMessageContent({
    messageText,
    isEditing,
    onSaveEdit,
}: {
    messageText: string;
    isEditing: boolean;
    onSaveEdit: () => void;
}) {
    if (!isEditing) {
        return <div className="whitespace-pre-wrap">{messageText}</div>;
    }

    return <EditableMessageContent onSaveEdit={onSaveEdit} />;
}

/**
 * 通用编辑内容组件
 */
function EditableMessageContent({
    onSaveEdit,
}: {
    onSaveEdit: () => void;
}) {
    const editingContent = useChatUIStore((s) => s.editingContent);
    const setEditingContent = useChatUIStore((s) => s.setEditingContent);
    const cancelEditing = useChatUIStore((s) => s.cancelEditing);

    return (
        <div className="flex flex-col gap-2 min-w-[300px]">
            <Textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                className="min-h-[80px] resize-none bg-background/40 border-border/60 focus:border-primary/50"
                autoFocus
                onKeyDown={(e) => {
                    if (e.key === "Escape") {
                        e.preventDefault();
                        cancelEditing();
                    }
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        onSaveEdit();
                    }
                }}
            />
            <div className="flex items-center justify-end gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={cancelEditing}
                    className="h-8 px-2 text-muted-foreground hover:text-foreground"
                >
                    <X size={14} className="mr-1" />
                    Cancel
                </Button>
                <Button
                    type="button"
                    size="sm"
                    onClick={onSaveEdit}
                    disabled={!editingContent.trim()}
                    className="h-8 px-2"
                >
                    <Check size={14} className="mr-1" />
                    Save
                </Button>
            </div>
            <div className="text-[11px] text-muted-foreground text-right">
                Ctrl/Cmd+Enter to save • Esc to cancel
            </div>
        </div>
    );
}
