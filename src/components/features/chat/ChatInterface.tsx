"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, StopCircle, User, Bot, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChatInterface() {
    const { model, temperature, topP, topK, reasoningEffort, systemInstruction } = useSettingsStore();

    const { messages, input, handleInputChange, handleSubmit, isLoading, stop, error } = useChat({
        api: "/api/chat",
        body: {
            model,
            temperature,
            topP,
            topK,
            reasoningEffort,
            system: systemInstruction,
        },
        onError: (err: any) => {
            console.error("Chat error:", err);
        }
    } as any) as any;

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as any);
        }
    }

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

                {messages.map((m: any) => (
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
                                <div className="whitespace-pre-wrap">{m.content}</div>
                            ) : (
                                <div className="markdown-body prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown>{m.content}</ReactMarkdown>
                                </div>
                            )}
                        </div>

                        {m.role === "user" && (
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                                <User size={18} />
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-4 max-w-3xl mx-auto w-full">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary animate-pulse">
                            <Loader2 size={18} className="animate-spin" />
                        </div>
                        <div className="ml-2 text-muted-foreground text-sm flex items-center">Generating...</div>
                    </div>
                )}
                {error && (
                    <div className="max-w-3xl mx-auto w-full p-4 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/20">
                        Error: {error.message}
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

                    <Button
                        type="submit"
                        size="icon"
                        disabled={isLoading && !error}
                        className={cn(isLoading ? "bg-destructive hover:bg-destructive/90" : "")}
                        onClick={isLoading ? stop : undefined}
                    >
                        {isLoading ? <StopCircle size={18} /> : <Send size={18} />}
                    </Button>
                </form>
                <div className="text-center text-xs text-muted-foreground mt-2">
                    Press Enter to send, Shift+Enter for new line
                </div>
            </div>
        </div>
    );
}
