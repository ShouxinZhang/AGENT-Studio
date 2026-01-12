"use client";

/**
 * ChatInterface - 聊天界面主组件
 * 
 * 重构说明：
 * - 引入 React Virtuoso 实现虚拟列表，优化长对话性能
 * - 自动滚动逻辑由 Virtuoso 的 followOutput 托管
 * - 统一管理加载状态和错误显示
 */

import { useChatLogic } from "./hooks/useChatLogic";
import { MessageBubble, ChatInput, EmptyState, LoadingIndicator, ErrorDisplay } from "./components";
import { AssistantMessageEditor } from "./components/AssistantMessageEditor";
import { useChatUIStore } from "@/lib/store/useChatUIStore";
import { Virtuoso } from "react-virtuoso";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export function ChatInterface() {
    const {
        input,
        messages,
        status,
        isLoading,
        error,
        handleSubmit,
        onInputKeyDown,
        handleInputChange,
        attachments,
        isUploadingAttachments,
        addFiles,
        removeAttachment,
        saveEdit,
        stop,
        regenerate,
    } = useChatLogic();

    const isStreaming = status === "streaming";
    
    // Store selectors
    const editingRole = useChatUIStore((s) => s.editingRole);
    const editingContent = useChatUIStore((s) => s.editingContent);
    const setEditingContent = useChatUIStore((s) => s.setEditingContent);
    const cancelEditing = useChatUIStore((s) => s.cancelEditing);
    
    const isAssistantEditorOpen = editingRole === "assistant";

    // Virtuoso ref for programmatic scrolling if needed
    const virtuosoRef = useRef(null);

    return (
        <div className="flex flex-col h-full relative bg-background">
            {/* Messages Area with Virtualization */}
            <div className="flex-1 min-h-0">
                {messages.length === 0 ? (
                    <div className="h-full overflow-y-auto p-4">
                        <EmptyState />
                    </div>
                ) : (
                    <Virtuoso
                        ref={virtuosoRef}
                        data={messages}
                        initialTopMostItemIndex={messages.length - 1}
                        followOutput={(isAtBottom) => {
                            // AI 正在输出时，强制跟随底部
                            if (isStreaming) return "smooth";
                            // 其他情况（如用户发送消息），如果已经在底部则跟随
                            return isAtBottom ? "smooth" : false;
                        }}
                        className="h-full"
                        itemContent={(index, m) => (
                            <div className={cn("p-4", index === 0 && "pt-6")}>
                                <MessageBubble
                                    message={m}
                                    isLastMessage={index === messages.length - 1}
                                    isStreaming={isStreaming}
                                    isLoading={isLoading}
                                    onSaveEdit={saveEdit}
                                    onRegenerate={regenerate}
                                />
                            </div>
                        )}
                        components={{
                            Footer: () => (
                                <div className="p-4 pt-0 space-y-4">
                                    {isLoading && <LoadingIndicator />}
                                    {error && <ErrorDisplay error={error} onRetry={regenerate} />}
                                    <div className="h-4" /> {/* Bottom padding */}
                                </div>
                            ),
                        }}
                    />
                )}
            </div>

            {/* Input Area */}
            <ChatInput
                input={input}
                isLoading={isLoading}
                onInputChange={handleInputChange}
                onKeyDown={onInputKeyDown}
                onSubmit={handleSubmit}
                onStop={stop}
                attachments={attachments}
                isUploadingAttachments={isUploadingAttachments}
                onAddFiles={addFiles}
                onRemoveAttachment={removeAttachment}
            />

            {/* Assistant edit (second-level page) */}
            <AssistantMessageEditor
                open={isAssistantEditorOpen}
                value={editingContent}
                onChange={setEditingContent}
                onCancel={cancelEditing}
                onSave={() => void saveEdit()}
            />
        </div>
    );
}
