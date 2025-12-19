"use client";

import * as React from "react";
import { useSettingsStore, ReasoningEffort } from "@/lib/store/useSettingsStore";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const AVAILABLE_MODELS = [
    { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash Preview" },
    { id: "google/gemini-3-pro-preview", name: "Gemini 3 Pro Preview" },
    { id: "openai/gpt-5.2", name: "GPT-5.2" },
    { id: "x-ai/grok-4.1-fast", name: "Grok 4.1 Fast" },
    { id: "anthropic/claude-opus-4.5", name: "Claude Opus 4.5" },
    { id: "anthropic/claude-sonnet-4.5", name: "Claude Sonnet 4.5" },
];

const REASONING_EFFORT_OPTIONS: { value: ReasoningEffort; label: string; description: string }[] = [
    { value: "xhigh", label: "Extra High", description: "~95% tokens for reasoning" },
    { value: "high", label: "High", description: "~80% tokens for reasoning" },
    { value: "medium", label: "Medium", description: "~50% tokens for reasoning" },
    { value: "low", label: "Low", description: "~20% tokens for reasoning" },
    { value: "minimal", label: "Minimal", description: "~10% tokens for reasoning" },
    { value: "none", label: "None", description: "Disable reasoning" },
];

export function SettingsPanel() {
    const {
        model,
        temperature,
        topP,
        topK,
        reasoningEffort,
        systemInstruction,
        setModel,
        setTemperature,
        setTopP,
        setTopK,
        setReasoningEffort,
        setSystemInstruction,
    } = useSettingsStore();

    return (
        <div className="flex flex-col h-full overflow-y-auto p-4 space-y-6 bg-card text-card-foreground border-l border-border">
            <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Run Settings</h3>

                <div className="space-y-2">
                    <Label>Model</Label>
                    <Select value={model} onChange={(e) => setModel(e.target.value)}>
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
                        value={reasoningEffort}
                        onChange={(e) => setReasoningEffort(e.target.value as ReasoningEffort)}
                    >
                        {REASONING_EFFORT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label} ({opt.description})
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
                        <span className="text-xs text-muted-foreground">{temperature}</span>
                    </div>
                    <Slider
                        min={0}
                        max={2}
                        step={0.1}
                        value={[temperature]}
                        onValueChange={(val) => setTemperature(val[0])}
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <Label>Top P</Label>
                        <span className="text-xs text-muted-foreground">{topP}</span>
                    </div>
                    <Slider
                        min={0}
                        max={1}
                        step={0.05}
                        value={[topP]}
                        onValueChange={(val) => setTopP(val[0])}
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <Label>Top K</Label>
                        <span className="text-xs text-muted-foreground">{topK}</span>
                    </div>
                    <Input
                        type="number"
                        value={topK}
                        onChange={(e) => setTopK(parseInt(e.target.value))}
                        className="bg-secondary border-none"
                    />
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">System Instructions</h3>
                <Textarea
                    placeholder="Enter system instructions..."
                    className="min-h-[200px] resize-none bg-secondary border-none font-mono text-xs"
                    value={systemInstruction}
                    onChange={(e) => setSystemInstruction(e.target.value)}
                />
            </div>
        </div>
    );
}
