"use client";

import { MessageSquare, History, Wrench, Plus, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SidebarView = "chat" | "history" | "tools" | "trace";

interface Props {
    currentView: SidebarView;
    onViewChange: (view: SidebarView) => void;
    onNewChat: () => void;
    gameTitle?: string;
}

export function PlaygroundChatHeader({ currentView, onViewChange, onNewChat }: Props) {
    return (
        <header className="h-12 border-b border-border flex items-center px-2 bg-card/80 backdrop-blur-md z-20 shrink-0">
            {/* View Switchers */}
            <div className="flex items-center gap-0.5">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewChange("chat")}
                    className={cn(
                        "h-8 w-8 transition-all",
                        currentView === "chat" ? "text-primary bg-primary/10" : "text-muted-foreground"
                    )}
                    title="Chat"
                >
                    <MessageSquare size={16} />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewChange("history")}
                    className={cn(
                        "h-8 w-8 transition-all",
                        currentView === "history" ? "text-primary bg-primary/10" : "text-muted-foreground"
                    )}
                    title="History"
                >
                    <History size={16} />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewChange("tools")}
                    className={cn(
                        "h-8 w-8 transition-all",
                        currentView === "tools" ? "text-primary bg-primary/10" : "text-muted-foreground"
                    )}
                    title="Tools"
                >
                    <Wrench size={16} />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewChange("trace")}
                    className={cn(
                        "h-8 w-8 transition-all",
                        currentView === "trace" ? "text-primary bg-primary/10" : "text-muted-foreground"
                    )}
                    title="LLM Trace"
                >
                    <Brain size={16} />
                </Button>
            </div>

            <div className="flex-1" />

            {/* Actions */}
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onNewChat}
                    className="h-8 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-neutral-800"
                >
                    <Plus size={14} />
                    <span>New</span>
                </Button>
            </div>
        </header>
    );
}
