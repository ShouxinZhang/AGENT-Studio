"use client";

/**
 * EmptyState & LoadingIndicator - 状态指示组件
 * 
 * EmptyState: 无消息时的空白占位
 * - 显示 Bot 图标和提示文字
 * - 引导用户开始对话
 * 
 * LoadingIndicator: AI 生成中的加载指示
 * - 显示旋转动画
 * - 提示"Generating..."
 */

import { Bot, Loader2 } from "lucide-react";

/**
 * 空状态组件
 * 当消息列表为空时显示，引导用户开始对话
 */
export function EmptyState() {
    return (
        <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 select-none">
            <Bot className="w-16 h-16 mb-4" />
            <p>Ready to help. Start typing below.</p>
        </div>
    );
}

/**
 * 加载指示器组件
 * AI 正在生成回复时显示
 */
export function LoadingIndicator() {
    return (
        <div className="flex gap-4 max-w-3xl mx-auto w-full">
            {/* 带动画的头像 */}
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary animate-pulse">
                <Loader2 size={18} className="animate-spin" />
            </div>
            {/* 提示文字 */}
            <div className="ml-2 text-muted-foreground text-sm flex items-center">
                Generating...
            </div>
        </div>
    );
}
