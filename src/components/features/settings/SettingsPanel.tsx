"use client";

import * as React from "react";
import { useSettingsStore, ReasoningEffort } from "@/lib/store/useSettingsStore";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Save, Check } from "lucide-react";
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

    // Local state for form fields
    const [localState, setLocalState] = React.useState({
        model: store.model,
        temperature: store.temperature,
        topP: store.topP,
        topK: store.topK,
        reasoningEffort: store.reasoningEffort,
        systemInstruction: store.systemInstruction,
    });

    const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);
    const [isSaved, setIsSaved] = React.useState(false);

    // Sync from store when it loads/changes (e.g. from persistence)
    React.useEffect(() => {
        setLocalState({
            model: store.model,
            temperature: store.temperature,
            topP: store.topP,
            topK: store.topK,
            reasoningEffort: store.reasoningEffort,
            systemInstruction: store.systemInstruction,
        });
    }, [store.model, store.temperature, store.topP, store.topK, store.reasoningEffort, store.systemInstruction]);

    const handleSave = () => {
        store.setModel(localState.model);
        store.setTemperature(localState.temperature);
        store.setTopP(localState.topP);
        store.setTopK(localState.topK);
        store.setReasoningEffort(localState.reasoningEffort);
        store.setSystemInstruction(localState.systemInstruction);

        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleChange = (field: keyof typeof localState, value: any) => {
        setLocalState(prev => ({ ...prev, [field]: value }));
    };

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
                    <Textarea
                        placeholder="Enter system instructions..."
                        className="min-h-[200px] resize-none bg-secondary border-none font-mono text-xs"
                        value={localState.systemInstruction}
                        onChange={(e) => handleChange("systemInstruction", e.target.value)}
                    />
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
