"use client";

import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import type { ReasoningEffort } from "@/lib/store/useSettingsStore";
import { AVAILABLE_MODELS, REASONING_EFFORT_OPTIONS } from "@/lib/config/llm";
import { cn } from "@/lib/utils";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select } from "@/components/ui/select";

type Props = {
    model: string;
    reasoningEffort: ReasoningEffort;
    temperature: number;
    topP: number;
    topK: number;
    chatMemoryTurns: number;
    isAdvancedOpen: boolean;
    onToggleAdvanced: () => void;
    onChange: <K extends "model" | "reasoningEffort" | "temperature" | "topP" | "topK" | "chatMemoryTurns">(
        field: K,
        value: K extends "reasoningEffort" ? ReasoningEffort : string | number
    ) => void;
    apiKeySummary: string;
    activeSystemInstructionTitle: string;
    onOpenOpenRouter: () => void;
    onOpenInstructions: () => void;
    onOpenMcpTools: () => void;
};

export function SqlSettingsMainView({
    model,
    reasoningEffort,
    temperature,
    topP,
    topK,
    chatMemoryTurns,
    isAdvancedOpen,
    onToggleAdvanced,
    onChange,
    apiKeySummary,
    activeSystemInstructionTitle,
    onOpenOpenRouter,
    onOpenInstructions,
    onOpenMcpTools,
}: Props) {
    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Run Settings</h3>

                <div className="space-y-2">
                    <Label>Model</Label>
                    <Select value={model} onChange={(e) => onChange("model", e.target.value)}>
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
                        onChange={(e) => onChange("reasoningEffort", e.target.value as ReasoningEffort)}
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
                        <span className="text-xs text-muted-foreground">{temperature}</span>
                    </div>
                    <Slider
                        min={0}
                        max={2}
                        step={0.1}
                        value={[temperature]}
                        onValueChange={(val) => onChange("temperature", val[0])}
                    />
                </div>

                <div className="pt-2">
                    <button
                        onClick={onToggleAdvanced}
                        className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {isAdvancedOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        Advanced Parameters
                    </button>

                    <div
                        className={cn(
                            "space-y-4 mt-4 overflow-hidden transition-all duration-200",
                            isAdvancedOpen ? "h-auto opacity-100" : "h-0 opacity-0 pointer-events-none mt-0"
                        )}
                    >
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
                                onValueChange={(val) => onChange("topP", val[0])}
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
                                onChange={(e) => onChange("topK", parseInt(e.target.value) || 0)}
                                className="bg-secondary border-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Chat Memory (Turns)</Label>
                                <span className="text-xs text-muted-foreground">{chatMemoryTurns}</span>
                            </div>
                            <Slider
                                min={0}
                                max={200}
                                step={1}
                                value={[chatMemoryTurns]}
                                onValueChange={(val) => onChange("chatMemoryTurns", val[0])}
                            />
                            <Input
                                type="number"
                                min={0}
                                value={chatMemoryTurns}
                                onChange={(e) => onChange("chatMemoryTurns", parseInt(e.target.value) || 0)}
                                className="bg-secondary border-none"
                            />
                            <p className="text-xs text-muted-foreground">
                                Limits how many recent turns are sent to the model each request. Set 0 for unlimited.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">API</h3>

                <button
                    onClick={onOpenOpenRouter}
                    className="w-full text-left p-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 border border-border/50 transition-all group"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium text-foreground">OpenRouter API Key</span>
                            <span className="text-xs text-muted-foreground">{apiKeySummary}</span>
                        </div>
                        <ChevronRight
                            size={16}
                            className="text-muted-foreground group-hover:translate-x-0.5 transition-transform"
                        />
                    </div>
                </button>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">System Instructions</h3>

                <button
                    onClick={onOpenInstructions}
                    className="w-full text-left p-4 rounded-xl bg-secondary/40 hover:bg-secondary/60 border border-border/50 transition-all group"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{activeSystemInstructionTitle}</span>
                        <ChevronRight
                            size={16}
                            className="text-muted-foreground group-hover:translate-x-0.5 transition-transform"
                        />
                    </div>
                </button>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">MCP Tools</h3>

                <button
                    onClick={onOpenMcpTools}
                    className="w-full text-left p-4 rounded-xl bg-secondary/40 hover:bg-secondary/60 border border-border/50 transition-all group"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium text-foreground">MCP Tools</span>
                            <span className="text-xs text-muted-foreground">Add and manage MCP servers</span>
                        </div>
                        <ChevronRight
                            size={16}
                            className="text-muted-foreground group-hover:translate-x-0.5 transition-transform"
                        />
                    </div>
                </button>
            </div>
        </div>
    );
}
