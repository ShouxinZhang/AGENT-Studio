"use client";

import * as React from "react";
import { useSettingsStore, ReasoningEffort } from "@/lib/store/useSettingsStore";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Save, Check, Trash2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const AVAILABLE_MODELS = [
    { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash Preview" },
    { id: "google/gemini-3-pro-preview", name: "Gemini 3 Pro Preview" },
    { id: "openai/gpt-5.2", name: "GPT-5.2" },
    { id: "x-ai/grok-4.1-fast", name: "Grok 4.1 Fast" },
    { id: "anthropic/claude-opus-4.5", name: "Claude Opus 4.5" },
    { id: "anthropic/claude-sonnet-4.5", name: "Claude Sonnet 4.5" },
];

const REASONING_EFFORT_OPTIONS: { value: ReasoningEffort; label: string }[] = [
    { value: "xhigh", label: "Extra High" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
    { value: "minimal", label: "Minimal" },
    { value: "none", label: "None" },
];

export function SettingsPanel() {
    const store = useSettingsStore();

    type LocalState = {
        model: string;
        temperature: number;
        topP: number;
        topK: number;
        reasoningEffort: ReasoningEffort;
        systemInstructions: typeof store.systemInstructions;
        activeSystemInstructionId: typeof store.activeSystemInstructionId;
    };

    // Local state for form fields
    const [localState, setLocalState] = React.useState<LocalState>(() => ({
        model: store.model,
        temperature: store.temperature,
        topP: store.topP,
        topK: store.topK,
        reasoningEffort: store.reasoningEffort,
        systemInstructions: store.systemInstructions,
        activeSystemInstructionId: store.activeSystemInstructionId,
    }));

    const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);
    const [isSaved, setIsSaved] = React.useState(false);
    const [currentView, setCurrentView] = React.useState<"main" | "instructions">("main");

    // Sync from store when it loads/changes (e.g. from persistence)
    React.useEffect(() => {
        setLocalState({
            model: store.model,
            temperature: store.temperature,
            topP: store.topP,
            topK: store.topK,
            reasoningEffort: store.reasoningEffort,
            systemInstructions: store.systemInstructions,
            activeSystemInstructionId: store.activeSystemInstructionId,
        });
    }, [store.model, store.temperature, store.topP, store.topK, store.reasoningEffort, store.systemInstructions, store.activeSystemInstructionId]);

    const handleSave = () => {
        store.setModel(localState.model);
        store.setTemperature(localState.temperature);
        store.setTopP(localState.topP);
        store.setTopK(localState.topK);
        store.setReasoningEffort(localState.reasoningEffort);
        
        // Sync all instructions back to store
        localState.systemInstructions.forEach(si => {
            store.updateSystemInstruction(si.id, { title: si.title, content: si.content });
        });
        store.setActiveSystemInstructionId(localState.activeSystemInstructionId);

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
        const newId = Math.random().toString(36).substring(7);
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
        store.deleteSystemInstruction(id);
    };

    const activeInstruction = localState.systemInstructions.find(si => si.id === localState.activeSystemInstructionId);

    if (currentView === "instructions") {
        return (
            <div className="flex flex-col h-full bg-card text-card-foreground border-l border-border animate-in slide-in-from-right duration-300">
                <div className="p-4 border-b border-border flex items-center gap-3">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setCurrentView("main")}
                        className="h-8 w-8"
                    >
                        <ArrowLeft size={18} />
                    </Button>
                    <h3 className="font-semibold text-sm uppercase tracking-wider">System Instructions</h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div className="space-y-3">
                        <Label className="text-xs text-muted-foreground uppercase">Select Preset</Label>
                        <Select
                            value={localState.activeSystemInstructionId || ""}
                            onChange={(e) => {
                                if (e.target.value === "new") {
                                    handleAddInstruction();
                                } else {
                                    handleChange("activeSystemInstructionId", e.target.value);
                                }
                            }}
                            className="bg-secondary/50 border-border/50"
                        >
                            <option value="new">+ Create new instruction</option>
                            {localState.systemInstructions.map((si) => (
                                <option key={si.id} value={si.id}>
                                    {si.title}
                                </option>
                            ))}
                        </Select>

                        {activeInstruction && (
                            <div className="space-y-4 pt-2 animate-in fade-in duration-200">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase">Instruction Title</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Title"
                                            value={activeInstruction.title}
                                            onChange={(e) => handleInstructionChange(activeInstruction.id, 'title', e.target.value)}
                                            className="bg-secondary border-none h-10"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteInstruction(activeInstruction.id)}
                                            className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 size={18} />
                                        </Button>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase">Instructions</Label>
                                    <Textarea
                                        placeholder="Optional tone and style instructions for the model"
                                        className="min-h-[400px] resize-none bg-secondary border-none font-mono text-xs leading-relaxed p-4"
                                        value={activeInstruction.content}
                                        onChange={(e) => handleInstructionChange(activeInstruction.id, 'content', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-border bg-card/50">
                    <Button
                        onClick={() => {
                            handleSave();
                            setCurrentView("main");
                        }}
                        className="w-full"
                    >
                        Done
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-card text-card-foreground border-l border-border">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="space-y-4">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Run Settings</h3>

                    <div className="space-y-2">
                        <Label>Model</Label>
                        <Select
                            value={localState.model}
                            onChange={(e) => handleChange("model", e.target.value)}
                        >
                            {AVAILABLE_MODELS.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.name}
                                </option>
                            ))}
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Thinking Effort</Label>
                        <Select
                            value={localState.reasoningEffort}
                            onChange={(e) => handleChange("reasoningEffort", e.target.value as ReasoningEffort)}
                        >
                            {REASONING_EFFORT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Controls how much the model reasons before responding.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label>Temperature</Label>
                            <span className="text-xs text-muted-foreground">{localState.temperature}</span>
                        </div>
                        <Slider
                            min={0}
                            max={2}
                            step={0.1}
                            value={[localState.temperature]}
                            onValueChange={(val) => handleChange("temperature", val[0])}
                        />
                    </div>

                    {/* Advanced Settings Toggle */}
                    <div className="pt-2">
                        <button
                            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {isAdvancedOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            Advanced Parameters
                        </button>

                        <div className={cn(
                            "space-y-4 mt-4 overflow-hidden transition-all duration-200",
                            isAdvancedOpen ? "h-auto opacity-100" : "h-0 opacity-0 pointer-events-none mt-0"
                        )}>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Top P</Label>
                                    <span className="text-xs text-muted-foreground">{localState.topP}</span>
                                </div>
                                <Slider
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    value={[localState.topP]}
                                    onValueChange={(val) => handleChange("topP", val[0])}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Top K</Label>
                                    <span className="text-xs text-muted-foreground">{localState.topK}</span>
                                </div>
                                <Input
                                    type="number"
                                    value={localState.topK}
                                    onChange={(e) => handleChange("topK", parseInt(e.target.value) || 0)}
                                    className="bg-secondary border-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">System Instructions</h3>
                    
                    <button
                        onClick={() => setCurrentView("instructions")}
                        className="w-full text-left p-4 rounded-xl bg-secondary/40 hover:bg-secondary/60 border border-border/50 transition-all group"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">
                                {activeInstruction?.title || "System instructions"}
                            </span>
                            <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </button>
                </div>
            </div>

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
