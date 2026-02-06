"use client";

import { useChatStore } from "@/lib/store/useChatStore";
import { formatDistanceToNow } from "date-fns";
import { History, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PlaygroundHistoryList() {
    const { conversations, activeConversationId, setActiveConversation, deleteConversation } = useChatStore();

    if (conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-2 opacity-50">
                <History className="size-8" />
                <p className="text-sm">No chat history yet</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Recent Sessions
            </div>
            {conversations.map((c) => (
                <div
                    key={c.id}
                    className={cn(
                        "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-all border border-transparent",
                        activeConversationId === c.id
                            ? "bg-primary/10 border-primary/20 text-foreground"
                            : "hover:bg-neutral-800/50 text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setActiveConversation(c.id)}
                >
                    <MessageSquare size={14} className={activeConversationId === c.id ? "text-primary" : "opacity-50"} />
                    <div className="flex-1 min-w-0">
                        <div className="truncate font-medium">{c.title}</div>
                        <div className="text-[10px] opacity-50">
                            {formatDistanceToNow(c.updatedAt, { addSuffix: true })}
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(c.id);
                        }}
                    >
                        <Trash2 size={12} />
                    </Button>
                </div>
            ))}
        </div>
    );
}
