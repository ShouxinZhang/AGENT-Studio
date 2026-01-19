"use client";

import * as React from "react";
import type { ReasoningEffort, SystemInstruction } from "@/lib/store/useSettingsStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { Button } from "@/components/ui/button";
import { Check, Save } from "lucide-react";

import { OpenRouterSettingsView } from "@/components/features/settings/views/OpenRouterSettingsView";
import { SystemInstructionsView } from "@/components/features/settings/views/SystemInstructionsView";
import { McpToolsView } from "@/components/features/settings/views/McpToolsView";
import { McpAddServerView } from "@/components/features/settings/views/McpAddServerView";

import { SqlSettingsMainView } from "@/components/features/sql/SqlSettingsMainView";
import { PostgresMcpToolView } from "@/components/features/sql/PostgresMcpToolView";

function generateId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).slice(2);
}

type McpServerType = "npm" | "pip" | "docker" | "nuget" | "remote";

function parseMcpServerType(value: string): McpServerType {
    switch (value) {
        case "npm":
        case "pip":
        case "docker":
        case "nuget":
        case "remote":
            return value;
        default:
            return "npm";
    }
}

export function SqlSettingsPanel() {
    const store = useSettingsStore();

    type LocalState = {
        model: string;
        temperature: number;
        topP: number;
        topK: number;
        reasoningEffort: ReasoningEffort;
        chatMemoryTurns: number;
        openRouterApiKey: string;
        systemInstructions: SystemInstruction[];
        activeSystemInstructionId: string | null;
    };

    const [localState, setLocalState] = React.useState<LocalState>(() => ({
        model: store.model,
        temperature: store.temperature,
        topP: store.topP,
        topK: store.topK,
        reasoningEffort: store.reasoningEffort,
        chatMemoryTurns: store.chatMemoryTurns,
        openRouterApiKey: store.openRouterApiKey,
        systemInstructions: store.systemInstructions,
        activeSystemInstructionId: store.activeSystemInstructionId,
    }));

    const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);
    const [isSaved, setIsSaved] = React.useState(false);
    const [currentView, setCurrentView] = React.useState<
        "main" | "instructions" | "openrouter" | "mcp-tools" | "mcp-add" | "postgres-tool"
    >("main");

    const [mcpServers, setMcpServers] = React.useState<Array<{ id: string; name: string; type: McpServerType }>>([]);

    const refreshMcpServers = React.useCallback(async () => {
        try {
            const res = await fetch("/api/mcp/servers", { cache: "no-store" });
            if (!res.ok) return;
            const data = (await res.json()) as Array<{ id: string; name: string; type: string }>;
            setMcpServers(
                (data || []).map((s) => ({
                    id: s.id,
                    name: s.name,
                    type: parseMcpServerType(s.type),
                }))
            );
        } catch {
            // ignore
        }
    }, []);

    React.useEffect(() => {
        if (currentView === "mcp-tools") {
            void refreshMcpServers();
        }
    }, [currentView, refreshMcpServers]);

    React.useEffect(() => {
        setLocalState({
            model: store.model,
            temperature: store.temperature,
            topP: store.topP,
            topK: store.topK,
            reasoningEffort: store.reasoningEffort,
            chatMemoryTurns: store.chatMemoryTurns,
            openRouterApiKey: store.openRouterApiKey,
            systemInstructions: store.systemInstructions,
            activeSystemInstructionId: store.activeSystemInstructionId,
        });
    }, [
        store.model,
        store.temperature,
        store.topP,
        store.topK,
        store.reasoningEffort,
        store.chatMemoryTurns,
        store.openRouterApiKey,
        store.systemInstructions,
        store.activeSystemInstructionId,
    ]);

    const handleSave = () => {
        store.setModel(localState.model);
        store.setTemperature(localState.temperature);
        store.setTopP(localState.topP);
        store.setTopK(localState.topK);
        store.setReasoningEffort(localState.reasoningEffort);
        store.setChatMemoryTurns(localState.chatMemoryTurns);
        store.setOpenRouterApiKey(localState.openRouterApiKey);
        store.setSystemInstructions(localState.systemInstructions, localState.activeSystemInstructionId);

        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleChange = <K extends keyof LocalState>(field: K, value: LocalState[K]) => {
        setLocalState((prev) => ({ ...prev, [field]: value }));
    };

    const handleInstructionChange = (id: string, field: "title" | "content", value: string) => {
        setLocalState((prev) => ({
            ...prev,
            systemInstructions: prev.systemInstructions.map((si) => (si.id === id ? { ...si, [field]: value } : si)),
        }));
    };

    const handleAddInstruction = () => {
        const newId = generateId();
        const newInstruction = { id: newId, title: "Untitled instruction", content: "" };
        setLocalState((prev) => ({
            ...prev,
            systemInstructions: [...prev.systemInstructions, newInstruction],
            activeSystemInstructionId: newId,
        }));
    };

    const handleDeleteInstruction = (id: string) => {
        setLocalState((prev) => {
            const nextInstructions = prev.systemInstructions.filter((si) => si.id !== id);
            let nextActiveId = prev.activeSystemInstructionId;
            if (nextActiveId === id) {
                nextActiveId = nextInstructions.length > 0 ? nextInstructions[0].id : null;
            }
            return {
                ...prev,
                systemInstructions: nextInstructions,
                activeSystemInstructionId: nextActiveId,
            };
        });
    };

    const activeInstruction = localState.systemInstructions.find((si) => si.id === localState.activeSystemInstructionId);

    const apiKeySummary = React.useMemo(() => {
        const key = (localState.openRouterApiKey || "").trim();
        if (!key) return "Not set";
        return `••••${key.slice(-4)}`;
    }, [localState.openRouterApiKey]);

    if (currentView === "openrouter") {
        return (
            <OpenRouterSettingsView
                apiKey={localState.openRouterApiKey}
                onChangeApiKey={(next) => handleChange("openRouterApiKey", next)}
                onBack={() => setCurrentView("main")}
                onDone={() => {
                    handleSave();
                    setCurrentView("main");
                }}
            />
        );
    }

    if (currentView === "instructions") {
        return (
            <SystemInstructionsView
                systemInstructions={localState.systemInstructions}
                activeSystemInstructionId={localState.activeSystemInstructionId}
                onSetActiveSystemInstructionId={(id) => handleChange("activeSystemInstructionId", id)}
                onAddInstruction={handleAddInstruction}
                onDeleteInstruction={handleDeleteInstruction}
                onChangeInstruction={handleInstructionChange}
                onBack={() => setCurrentView("main")}
                onDone={() => {
                    handleSave();
                    setCurrentView("main");
                }}
            />
        );
    }

    if (currentView === "mcp-tools") {
        return (
            <McpToolsView
                servers={mcpServers}
                onBack={() => setCurrentView("main")}
                onAddServer={() => setCurrentView("mcp-add")}
                onOpenPostgresTool={() => setCurrentView("postgres-tool")}
                defaultScope="sql"
            />
        );
    }

    if (currentView === "mcp-add") {
        return (
            <McpAddServerView
                onBack={() => setCurrentView("mcp-tools")}
                onCreated={(created) => {
                    setMcpServers((prev) => [
                        { id: created.id, name: created.name, type: parseMcpServerType(created.type) },
                        ...prev,
                    ]);
                    setCurrentView("mcp-tools");
                }}
            />
        );
    }

    if (currentView === "postgres-tool") {
        return <PostgresMcpToolView onBack={() => setCurrentView("main")} />;
    }

    return (
        <div className="flex flex-col h-full bg-card text-card-foreground border-l border-border">
            <SqlSettingsMainView
                model={localState.model}
                reasoningEffort={localState.reasoningEffort}
                temperature={localState.temperature}
                topP={localState.topP}
                topK={localState.topK}
                chatMemoryTurns={localState.chatMemoryTurns}
                isAdvancedOpen={isAdvancedOpen}
                onToggleAdvanced={() => setIsAdvancedOpen((v) => !v)}
                onChange={(field, value) => handleChange(field as keyof LocalState, value as never)}
                apiKeySummary={apiKeySummary}
                activeSystemInstructionTitle={activeInstruction?.title || "System instructions"}
                onOpenOpenRouter={() => setCurrentView("openrouter")}
                onOpenInstructions={() => setCurrentView("instructions")}
                onOpenMcpTools={() => setCurrentView("mcp-tools")}
            />

            <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
                <Button
                    onClick={handleSave}
                    className="w-full flex items-center justify-center gap-2"
                    variant={isSaved ? "outline" : "default"}
                >
                    {isSaved ? (
                        <>
                            <Check size={16} className="text-green-500" />
                            Saved
                        </>
                    ) : (
                        <>
                            <Save size={16} />
                            Save Settings
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
