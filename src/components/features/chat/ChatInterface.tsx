"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { useChatStore } from "@/lib/store/useChatStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, StopCircle, User, Bot, Loader2, BrainIcon, RotateCcw, Copy, Check } from "lucide-react";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ui/reasoning";
import { cn } from "@/lib/utils";

const getMessageText = (message: UIMessage) =>
    message.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("");

const getChatBody = () => {
    const { model, temperature, topP, topK, reasoningEffort, systemInstruction } = useSettingsStore.getState();

    return {
        model,
        temperature,
        topP,
        topK,
        reasoningEffort,
        system: systemInstruction,
    };
};

export function ChatInterface() {
    const [input, setInput] = useState("");
    const activeConversationId = useChatStore((state) => state.activeConversationId);
    const activeConversation = useChatStore((state) =>
        state.conversations.find((conversation) => conversation.id === state.activeConversationId)
    );
    const updateConversationMessages = useChatStore((state) => state.updateConversationMessages);

    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };
    const chatTransport = useMemo(
        () =>
            new DefaultChatTransport({
                api: "/api/chat",
                body: getChatBody,
            }),
        []
    );

    const { messages, sendMessage, stop, regenerate, status, error } = useChat({
        id: activeConversationId,
        messages: activeConversation?.messages ?? [],
        transport: chatTransport,
        onError: (err) => {
            console.error("Chat error:", err);
        },
    });

    const isLoading = status === "submitted" || status === "streaming";

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (!activeConversationId) {
            return;
        }

        updateConversationMessages(activeConversationId, messages);
    }, [activeConversationId, messages, updateConversationMessages]);

    const handleSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
        event?.preventDefault();
        const trimmedInput = input.trim();

        if (!trimmedInput || isLoading) {
            return;
        }

        void sendMessage({ text: trimmedInput });
        setInput("");
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(event.target.value);
    };

    return (
        <div className="flex flex-col h-full relative bg-background">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 select-none">
                        <Bot className="w-16 h-16 mb-4" />
                        <p>Ready to help. Start typing below.</p>
                    </div>
                )}

                {messages.map((m) => {
                    const messageText = getMessageText(m);

                    return (
                        <div
                            key={m.id}
                            className={cn(
                                "flex gap-4 max-w-3xl mx-auto w-full",
                                m.role === "user" ? "justify-end" : "justify-start"
                            )}
                        >
                            {m.role === "assistant" && (
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary">
                                    <Bot size={18} />
                                </div>
                            )}

                            <div
                                className={cn(
                                    "rounded-lg px-4 py-3 text-sm leading-relaxed max-w-[85%]",
                                    m.role === "user"
                                        ? "bg-secondary text-secondary-foreground"
                                        : "bg-transparent text-foreground"
                                )}
                            >
                                {m.role === "user" ? (
                                    <div className="whitespace-pre-wrap">{getMessageText(m)}</div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {m.parts.map((part, i) => {
                                            if (part.type === "reasoning") {
                                                const reasoningText = part.text || "(No reasoning content available)";
                                                return (
                                                    <Reasoning
                                                        key={`${m.id}-${i}`}
                                                        isStreaming={
                                                            status === "streaming" &&
                                                            i === m.parts.length - 1 &&
                                                            m.id === messages[messages.length - 1]?.id
                                                        }
                                                        className="w-full"
                                                    >
                                                        <ReasoningTrigger />
                                                        <ReasoningContent>{reasoningText}</ReasoningContent>
                                                    </Reasoning>
                                                );
                                            }

                                            if (part.type === "text") {
                                                return (
                                                    <div key={`${m.id}-${i}`} className="markdown-body prose prose-invert prose-sm max-w-none">
                                                        <ReactMarkdown>{part.text}</ReactMarkdown>
                                                    </div>
                                                );
                                            }

                                            return null;
                                        })}
                                    </div>
                                )}

                                {m.role === "assistant" && !isLoading && (
                                    <div className="flex items-center gap-1 mt-2 -ml-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                                            onClick={() => handleCopy(m.id, messageText)}
                                            title="Copy message"
                                        >
                                            {copiedId === m.id ? <Check size={14} /> : <Copy size={14} />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                                            onClick={() => regenerate()}
                                            title="Regenerate"
                                        >
                                            <RotateCcw size={14} />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {m.role === "user" && (
                                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                                    <User size={18} />
                                </div>
                            )}
                        </div>
                    );
                })}

                {isLoading && (
                    <div className="flex gap-4 max-w-3xl mx-auto w-full">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary animate-pulse">
                            <Loader2 size={18} className="animate-spin" />
                        </div>
                        <div className="ml-2 text-muted-foreground text-sm flex items-center">Generating...</div>
                    </div>
                )}
                {error && (
                    <div className="max-w-3xl mx-auto w-full p-4 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/20 flex flex-col gap-3">
                        <div>Error: {error.message}</div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => regenerate()}
                            className="w-fit border-destructive/20 hover:bg-destructive/20 text-destructive"
                        >
                            <RotateCcw size={14} className="mr-2" />
                            Retry Message
                        </Button>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-background">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative flex gap-2 items-end">
                    <div className="relative flex-1">
                        <Textarea
                            value={input}
                            onChange={handleInputChange}
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
                            onClick={stop}
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
        </div>
    );
}
