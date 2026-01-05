"use client";

import * as React from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
    apiKey: string;
    onChangeApiKey: (next: string) => void;
    onBack: () => void;
    onDone: () => void;
};

export function OpenRouterSettingsView({ apiKey, onChangeApiKey, onBack, onDone }: Props) {
    const [isApiKeyVisible, setIsApiKeyVisible] = React.useState(false);

    return (
        <div className="flex flex-col h-full bg-card text-card-foreground border-l border-border animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-border flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className="h-8 w-8"
                    title="Back"
                >
                    <ArrowLeft size={18} />
                </Button>
                <h3 className="font-semibold text-sm uppercase tracking-wider">OpenRouter API Key</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase">API Key</Label>
                    <div className="flex gap-2">
                        <Input
                            type={isApiKeyVisible ? "text" : "password"}
                            placeholder="sk-or-v1..."
                            value={apiKey}
                            onChange={(e) => onChangeApiKey(e.target.value)}
                            className="bg-secondary border-none h-10"
                            autoComplete="off"
                            spellCheck={false}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-muted-foreground"
                            onClick={() => setIsApiKeyVisible((v) => !v)}
                            title={isApiKeyVisible ? "Hide" : "Show"}
                            aria-label={isApiKeyVisible ? "Hide API key" : "Show API key"}
                        >
                            {isApiKeyVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Stored locally in your browser and sent with chat requests.
                    </p>
                </div>

                <div>
                    <Button
                        type="button"
                        variant="ghost"
                        className="w-full justify-start text-muted-foreground hover:text-destructive"
                        onClick={() => {
                            onChangeApiKey("");
                            setIsApiKeyVisible(false);
                        }}
                    >
                        Clear key
                    </Button>
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
