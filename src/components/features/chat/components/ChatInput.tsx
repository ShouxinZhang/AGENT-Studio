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
import { Send, StopCircle } from "lucide-react";

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
}

export function ChatInput({
    input,
    isLoading,
    onInputChange,
    onKeyDown,
    onSubmit,
    onStop,
}: ChatInputProps) {
    return (
        <div className="p-4 border-t border-border bg-background">
            <form onSubmit={onSubmit} className="max-w-3xl mx-auto relative flex gap-2 items-end">
                <div className="relative flex-1">
                    <Textarea
                        value={input}
                        onChange={onInputChange}
                        onKeyDown={onKeyDown}
                        placeholder="Type your message here..."
                        className="min-h-[50px] max-h-[200px] pr-12 resize-none bg-secondary/50 border-transparent focus:border-primary/50"
                        rows={1}
                    />
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
                        disabled={!input.trim() || isLoading}
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
