"use client";

import { useMemo, useState } from "react";
import { ChatInterface } from "@/components/features/chat/ChatInterface";
import { SettingsPanel } from "@/components/features/settings/SettingsPanel";
import { Box, Menu, PanelLeftClose, PanelLeft, PanelRightClose, PanelRight, Plus, Trash2, Edit2, Check, X, Gamepad2, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/lib/store/useChatStore";
import Link from "next/link";

export function StudioLayout() {
    const [leftPanelOpen, setLeftPanelOpen] = useState(true);
    const [rightPanelOpen, setRightPanelOpen] = useState(true);
    const conversations = useChatStore((state) => state.conversations);
    const activeConversationId = useChatStore((state) => state.activeConversationId);
    const createConversation = useChatStore((state) => state.createConversation);
    const setActiveConversation = useChatStore((state) => state.setActiveConversation);
    const deleteConversation = useChatStore((state) => state.deleteConversation);
    const renameConversation = useChatStore((state) => state.renameConversation);
    const sortedConversations = useMemo(
        () => [...conversations].sort((a, b) => b.updatedAt - a.updatedAt),
        [conversations]
    );

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
                    <Link 
                        href="/learning" 
                        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground px-2.5 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 hover:text-foreground transition-all border border-border/50 shadow-sm"
                    >
                        <GraduationCap size={14} className="text-blue-500" />
                        <span>Learning Lab</span>
                    </Link>

                    <Link 
                        href="/playground" 
                        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground px-2.5 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 hover:text-foreground transition-all border border-border/50 shadow-sm"
                    >
                        <Gamepad2 size={14} className="text-indigo-500" />
                        <span>Game Playground</span>
                    </Link>

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
                        <button
                            type="button"
                            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                            onClick={() => createConversation()}
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        <button
                            type="button"
                            className="w-full text-left p-2.5 rounded-md bg-primary/10 text-primary text-sm cursor-pointer border border-primary/20"
                            onClick={() => createConversation()}
                        >
                            New Chat
                        </button>
                        {sortedConversations.map((conversation) => (
                            <HistoryItem
                                key={conversation.id}
                                conversation={conversation}
                                isActive={conversation.id === activeConversationId}
                                onSelect={() => setActiveConversation(conversation.id)}
                                onDelete={() => deleteConversation(conversation.id)}
                                onRename={(title) => renameConversation(conversation.id, title)}
                            />
                        ))}
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

interface HistoryItemProps {
    conversation: { id: string; title: string };
    isActive: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onRename: (title: string) => void;
}

function HistoryItem({ conversation, isActive, onSelect, onDelete, onRename }: HistoryItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(conversation.title);

    const handleRename = () => {
        if (title.trim() && title !== conversation.title) {
            onRename(title.trim());
        } else {
            setTitle(conversation.title);
        }
        setIsEditing(false);
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleRename();
        } else if (e.key === "Escape") {
            setTitle(conversation.title);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-1 p-1 bg-secondary rounded-md">
                <input
                    autoFocus
                    className="flex-1 bg-transparent text-sm outline-none px-1.5 py-1 min-w-0"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={onKeyDown}
                    onBlur={handleRename}
                />
                <button
                    onClick={handleRename}
                    className="p-1 rounded hover:bg-primary/20 text-primary"
                >
                    <Check size={12} />
                </button>
                <button
                    onClick={() => {
                        setTitle(conversation.title);
                        setIsEditing(false);
                    }}
                    className="p-1 rounded hover:bg-destructive/20 text-destructive"
                >
                    <X size={12} />
                </button>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "group flex items-center gap-1 rounded-md text-sm cursor-pointer relative",
                isActive
                    ? "bg-secondary text-foreground"
                    : "hover:bg-secondary text-muted-foreground"
            )}
        >
            <button
                type="button"
                className="flex-1 text-left p-2.5 truncate"
                onClick={onSelect}
                title={conversation.title}
            >
                {conversation.title}
            </button>
            <div className={cn(
                "absolute right-1 flex items-center gap-0.5",
                isActive ? "flex" : "hidden group-hover:flex"
            )}>
                <button
                    type="button"
                    className="p-1.5 rounded hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                    }}
                >
                    <Edit2 size={12} />
                </button>
                <button
                    type="button"
                    className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                >
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
    );
}
