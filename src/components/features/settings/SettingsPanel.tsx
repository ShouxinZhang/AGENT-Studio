"use client";

import * as React from "react";
import type { ReasoningEffort, SystemInstruction } from "@/lib/store/useSettingsStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { Button } from "@/components/ui/button";
import { Check, Save } from "lucide-react";

import { OpenRouterSettingsView } from "@/components/features/settings/views/OpenRouterSettingsView";
import { SettingsMainView } from "@/components/features/settings/views/SettingsMainView";
import { SystemInstructionsView } from "@/components/features/settings/views/SystemInstructionsView";

function generateId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).slice(2);
}

export function SettingsPanel() {
    const store = useSettingsStore();

    type LocalState = {
        model: string;
        temperature: number;
        topP: number;
        topK: number;
        reasoningEffort: ReasoningEffort;
        openRouterApiKey: string;
        systemInstructions: SystemInstruction[];
        activeSystemInstructionId: string | null;
    };

    // Local state for form fields
    const [localState, setLocalState] = React.useState<LocalState>(() => ({
        model: store.model,
        temperature: store.temperature,
        topP: store.topP,
        topK: store.topK,
        reasoningEffort: store.reasoningEffort,
        openRouterApiKey: store.openRouterApiKey,
        systemInstructions: store.systemInstructions,
        activeSystemInstructionId: store.activeSystemInstructionId,
    }));

    const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);
    const [isSaved, setIsSaved] = React.useState(false);
    const [currentView, setCurrentView] = React.useState<"main" | "instructions" | "openrouter">("main");

    // Sync from store when it loads/changes (e.g. from persistence)
    React.useEffect(() => {
        setLocalState({
            model: store.model,
            temperature: store.temperature,
            topP: store.topP,
            topK: store.topK,
            reasoningEffort: store.reasoningEffort,
            openRouterApiKey: store.openRouterApiKey,
            systemInstructions: store.systemInstructions,
            activeSystemInstructionId: store.activeSystemInstructionId,
        });
    }, [store.model, store.temperature, store.topP, store.topK, store.reasoningEffort, store.openRouterApiKey, store.systemInstructions, store.activeSystemInstructionId]);

    const handleSave = () => {
        store.setModel(localState.model);
        store.setTemperature(localState.temperature);
        store.setTopP(localState.topP);
        store.setTopK(localState.topK);
        store.setReasoningEffort(localState.reasoningEffort);
        store.setOpenRouterApiKey(localState.openRouterApiKey);

        store.setSystemInstructions(localState.systemInstructions, localState.activeSystemInstructionId);

        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleChange = <K extends keyof LocalState>(field: K, value: LocalState[K]) => {
        setLocalState(prev => ({ ...prev, [field]: value }));
    };

    const handleInstructionChange = (id: string, field: 'title' | 'content', value: string) => {
        setLocalState(prev => ({
            ...prev,
            systemInstructions: prev.systemInstructions.map(si => 
                si.id === id ? { ...si, [field]: value } : si
            )
        }));
    };

    const handleAddInstruction = () => {
        const newId = generateId();
        const newInstruction = { id: newId, title: "Untitled instruction", content: "" };
        setLocalState(prev => ({
            ...prev,
            systemInstructions: [...prev.systemInstructions, newInstruction],
            activeSystemInstructionId: newId
        }));
    };

    const handleDeleteInstruction = (id: string) => {
        setLocalState(prev => {
            const nextInstructions = prev.systemInstructions.filter(si => si.id !== id);
            let nextActiveId = prev.activeSystemInstructionId;
            if (nextActiveId === id) {
                nextActiveId = nextInstructions.length > 0 ? nextInstructions[0].id : null;
            }
            return {
                ...prev,
                systemInstructions: nextInstructions,
                activeSystemInstructionId: nextActiveId
            };
        });
    };

    const activeInstruction = localState.systemInstructions.find(si => si.id === localState.activeSystemInstructionId);

    const apiKeySummary = React.useMemo(() => {
        const key = (localState.openRouterApiKey || "").trim();
        if (!key) return "Not set";
        const tail = key.slice(-4);
        return `••••${tail}`;
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

    return (
        <div className="flex flex-col h-full bg-card text-card-foreground border-l border-border">
            <SettingsMainView
                model={localState.model}
                reasoningEffort={localState.reasoningEffort}
                temperature={localState.temperature}
                topP={localState.topP}
                topK={localState.topK}
                isAdvancedOpen={isAdvancedOpen}
                onToggleAdvanced={() => setIsAdvancedOpen((v) => !v)}
                onChange={(field, value) => handleChange(field as keyof LocalState, value as never)}
                apiKeySummary={apiKeySummary}
                activeSystemInstructionTitle={activeInstruction?.title || "System instructions"}
                onOpenOpenRouter={() => setCurrentView("openrouter")}
                onOpenInstructions={() => setCurrentView("instructions")}
            />

            {/* Save Button */}
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
