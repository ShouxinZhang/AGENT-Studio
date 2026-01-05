"use client";

/**
 * useChatLogic - 聊天核心逻辑 Hook
 * 
 * 该 Hook 封装了聊天功能的所有状态管理和业务逻辑。
 * 
 * 重构说明：
 * - 移除了手动滚动逻辑 (scrollRef)，改由 React Virtuoso 处理
 */

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { useChatStore } from "@/lib/store/useChatStore";
import { useChatUIStore } from "@/lib/store/useChatUIStore";

/**
 * 从消息对象中提取纯文本内容
 */
export const getMessageText = (message: UIMessage) =>
    message.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("");

/**
 * 构建 API 请求体
 */
const getChatBody = () => {
    const { model, temperature, topP, topK, reasoningEffort, openRouterApiKey, systemInstructions, activeSystemInstructionId } = useSettingsStore.getState();
    const activeInstruction = systemInstructions.find(si => si.id === activeSystemInstructionId);

    return {
        model,
        temperature,
        topP,
        topK,
        reasoningEffort,
        openRouterApiKey,
        system: activeInstruction?.content ?? "",
    };
};

/**
 * 聊天逻辑 Hook
 */
export function useChatLogic() {
    // ========== 状态定义 ==========
    
    /** 输入框内容 */
    const [input, setInput] = useState("");
    
    // ========== Store 选择器 ==========
    
    /** 当前活跃的会话 ID */
    const activeConversationId = useChatStore((state) => state.activeConversationId);
    
    /** 当前活跃的会话对象 */
    const activeConversation = useChatStore((state) =>
        state.conversations.find((conversation) => conversation.id === state.activeConversationId)
    );
    
    /** 更新会话消息的方法 */
    const updateConversationMessages = useChatStore((state) => state.updateConversationMessages);

    // ========== AI SDK 配置 ==========
    
    const chatTransport = useMemo(
        () =>
            new DefaultChatTransport({
                api: "/api/chat",
                body: getChatBody,
            }),
        []
    );

    const { messages, setMessages, sendMessage, stop, regenerate, status, error } = useChat({
        id: activeConversationId,
        messages: activeConversation?.messages ?? [],
        transport: chatTransport,
        onError: (err) => {
            console.error("Chat error:", err);
        },
    });

    /** 是否处于加载状态（已提交或流式输出中） */
    const isLoading = status === "submitted" || status === "streaming";

    const handleStop = useCallback(() => {
        stop();
    }, [stop]);

    const handleRegenerate = useCallback(() => {
        void regenerate();
    }, [regenerate]);

    // ========== 副作用 ==========
    
    /** 持久化消息到 Store */
    useEffect(() => {
        if (!activeConversationId) return;
        updateConversationMessages(activeConversationId, messages);
    }, [activeConversationId, messages, updateConversationMessages]);

    // ========== 操作方法 ==========
    
    /** 提交消息 */
    const handleSubmit = useCallback((event?: React.FormEvent<HTMLFormElement>) => {
        event?.preventDefault();
        const trimmedInput = input.trim();

        if (!trimmedInput || isLoading) return;

        // 如果正在编辑，先清除编辑状态
        const { editingId, cancelEditing } = useChatUIStore.getState();
        if (editingId) {
            cancelEditing();
        }

        void sendMessage({ text: trimmedInput });
        setInput("");
    }, [input, isLoading, sendMessage]);

    /** 输入框键盘事件处理 */
    const onInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    }, [handleSubmit]);

    /** 输入框内容变化处理 */
    const handleInputChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(event.target.value);
    }, []);

    /**
     * 保存编辑并重新生成
     */
    const saveEdit = useCallback(async () => {
        const { editingId, editingRole, editingContent, cancelEditing } = useChatUIStore.getState();
        
        if (!editingId || !editingRole) return;

        const nextText = editingContent.trim();
        if (!nextText) return;

        if (editingRole === "assistant") {
            const updated = messages.map((m) => {
                if (m.id !== editingId) return m;
                const nonTextParts = m.parts.filter((p) => p.type !== "text");
                return {
                    ...m,
                    parts: [...nonTextParts, { type: "text" as const, text: nextText }],
                };
            });

            setMessages(updated);
            if (activeConversationId) {
                updateConversationMessages(activeConversationId, updated);
            }
            cancelEditing();
            return;
        }

        if (!activeConversationId) return;

        const editedIndex = messages.findIndex((m) => m.id === editingId);
        if (editedIndex < 0) {
            cancelEditing();
            return;
        }

        const updated = messages
            .slice(0, editedIndex + 1)
            .map((m) =>
                m.id === editingId
                    ? { ...m, parts: [{ type: "text" as const, text: nextText }] }
                    : m
            );

        setMessages(updated);
        updateConversationMessages(activeConversationId, updated);
        cancelEditing();

        try {
            await regenerate();
        } catch (e) {
            console.error("Failed to regenerate after edit:", e);
        }
    }, [activeConversationId, messages, setMessages, updateConversationMessages, regenerate]);

    return {
        // State
        input,
        setInput,
        messages,
        status,
        isLoading,
        error,
        
        // Actions
        handleSubmit,
        onInputKeyDown,
        handleInputChange,
        saveEdit,
        stop: handleStop,
        regenerate: handleRegenerate,
    };
}
