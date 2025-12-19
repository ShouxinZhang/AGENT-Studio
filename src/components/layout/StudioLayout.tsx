"use client";

import { useState } from "react";
import { ChatInterface } from "@/components/features/chat/ChatInterface";
import { SettingsPanel } from "@/components/features/settings/SettingsPanel";
import { Box, Menu, PanelLeftClose, PanelLeft, PanelRightClose, PanelRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function StudioLayout() {
    const [leftPanelOpen, setLeftPanelOpen] = useState(true);
    const [rightPanelOpen, setRightPanelOpen] = useState(true);

    return (
        <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
            {/* Header */}
            <header className="h-12 border-b border-border flex items-center px-4 bg-card z-10 shrink-0">
                <div className="flex items-center gap-3">
                    {/* Toggle Left Panel */}
                    <button
                        onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                        className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {leftPanelOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
                    </button>

                    <div className="flex items-center gap-2 font-semibold text-foreground">
                        <div className="w-7 h-7 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                            <Box size={16} />
                        </div>
                        <span className="text-sm">Agent Studio</span>
                    </div>
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-muted-foreground px-2 py-1 rounded bg-secondary">Playground</span>

                    {/* Toggle Right Panel */}
                    <button
                        onClick={() => setRightPanelOpen(!rightPanelOpen)}
                        className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {rightPanelOpen ? <PanelRightClose size={18} /> : <PanelRight size={18} />}
                    </button>
                </div>
            </header>

            {/* Main 3-Column Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar */}
                <aside
                    className={cn(
                        "bg-card border-r border-border flex flex-col transition-all duration-200 ease-in-out overflow-hidden",
                        leftPanelOpen ? "w-60" : "w-0"
                    )}
                >
                    <div className="p-3 border-b border-border flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">History</span>
                        <button className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground">
                            <Plus size={14} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        <div className="p-2.5 rounded-md bg-primary/10 text-primary text-sm cursor-pointer border border-primary/20">
                            New Chat
                        </div>
                        <div className="p-2.5 rounded-md hover:bg-secondary text-sm text-muted-foreground cursor-pointer truncate">
                            Previous conversation...
                        </div>
                    </div>
                </aside>

                {/* Center - Chat Area */}
                <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <ChatInterface />
                </main>

                {/* Right Sidebar - Settings */}
                <aside
                    className={cn(
                        "border-l border-border transition-all duration-200 ease-in-out overflow-hidden",
                        rightPanelOpen ? "w-72" : "w-0"
                    )}
                >
                    <SettingsPanel />
                </aside>
            </div>
        </div>
    );
}
