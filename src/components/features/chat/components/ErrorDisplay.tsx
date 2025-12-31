"use client";

/**
 * ErrorDisplay - 错误展示组件
 * 
 * 当 AI 请求失败时显示错误信息和重试按钮。
 * 
 * 样式特点：
 * - 红色警告配色
 * - 显示错误详情
 * - 提供一键重试功能
 */

import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

/** ErrorDisplay 组件属性 */
interface ErrorDisplayProps {
    /** 错误对象 */
    error: Error;
    /** 重试回调 */
    onRetry: () => void;
}

/**
 * 错误展示组件
 * @param error - 错误对象，显示其 message 属性
 * @param onRetry - 点击重试按钮时的回调函数
 */
export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
    return (
        <div className="max-w-3xl mx-auto w-full p-4 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/20 flex flex-col gap-3">
            {/* 错误信息 */}
            <div>Error: {error.message}</div>
            {/* 重试按钮 */}
            <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="w-fit border-destructive/20 hover:bg-destructive/20 text-destructive"
            >
                <RotateCcw size={14} className="mr-2" />
                Retry Message
            </Button>
        </div>
    );
}
