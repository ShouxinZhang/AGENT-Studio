"use client";

import * as React from "react";
import { ArrowLeft, Trash2 } from "lucide-react";

import type { SystemInstruction } from "@/lib/store/useSettingsStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Props = {
    systemInstructions: SystemInstruction[];
    activeSystemInstructionId: string | null;
    onSetActiveSystemInstructionId: (id: string | null) => void;
    onAddInstruction: () => void;
    onDeleteInstruction: (id: string) => void;
    onChangeInstruction: (id: string, field: "title" | "content", value: string) => void;
    onBack: () => void;
    onDone: () => void;
};

export function SystemInstructionsView({
    systemInstructions,
    activeSystemInstructionId,
    onSetActiveSystemInstructionId,
    onAddInstruction,
    onDeleteInstruction,
    onChangeInstruction,
    onBack,
    onDone,
}: Props) {
    const activeInstruction = systemInstructions.find((si) => si.id === activeSystemInstructionId);

    return (
        <div className="flex flex-col h-full bg-card text-card-foreground border-l border-border animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-border flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
                    <ArrowLeft size={18} />
                </Button>
                <h3 className="font-semibold text-sm uppercase tracking-wider">System Instructions</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground uppercase">Select Preset</Label>
                    <Select
                        value={activeSystemInstructionId || ""}
                        onChange={(e) => {
                            if (e.target.value === "new") {
                                onAddInstruction();
                            } else {
                                onSetActiveSystemInstructionId(e.target.value);
                            }
                        }}
                        className="bg-secondary/50 border-border/50"
                    >
                        <option value="new">+ Create new instruction</option>
                        {systemInstructions.map((si) => (
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
                                        onChange={(e) => onChangeInstruction(activeInstruction.id, "title", e.target.value)}
                                        className="bg-secondary border-none h-10"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDeleteInstruction(activeInstruction.id)}
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
                                    onChange={(e) => onChangeInstruction(activeInstruction.id, "content", e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 border-t border-border bg-card/50">
                <Button onClick={onDone} className="w-full">
                    Done
                </Button>
            </div>
        </div>
    );
}
