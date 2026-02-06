"use client";

import * as React from "react";
import { Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { POSTGRES_MCP_TOOLS } from "@/lib/mcp/postgresMcpCatalog";
import { cn } from "@/lib/utils";
import { usePlaygroundSettingsStore } from "@/lib/store/usePlaygroundSettingsStore";
import { AVAILABLE_MODELS } from "@/lib/config/llm";

const EMPTY_TOOL_IDS: string[] = [];

export function PlaygroundToolsView() {
    const scope = "playground";
    const model = usePlaygroundSettingsStore((s) => s.model);
    const setModel = usePlaygroundSettingsStore((s) => s.setModel);
    const enabledToolIds = useSettingsStore((s) => s.enabledToolIdsByScope?.[scope] ?? EMPTY_TOOL_IDS);
    const toggleToolIdForScope = useSettingsStore((s) => s.toggleToolIdForScope);
    const setEnabledToolIdsForScope = useSettingsStore((s) => s.setEnabledToolIdsForScope);

    const [query, setQuery] = React.useState("");
    const queryNorm = query.trim().toLowerCase();

    const filteredTools = React.useMemo(() => {
        if (!queryNorm) return POSTGRES_MCP_TOOLS;
        return POSTGRES_MCP_TOOLS.filter((t) => {
            const hay = `${t.name} ${t.description}`.toLowerCase();
            return hay.includes(queryNorm);
        });
    }, [queryNorm]);

    const handleToggleAll = (on: boolean) => {
        if (on) {
            setEnabledToolIdsForScope(scope, POSTGRES_MCP_TOOLS.map(t => t.id));
        } else {
            setEnabledToolIdsForScope(scope, []);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="p-3 border-b border-border/50 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Configure Tools
                    </span>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                            onClick={() => handleToggleAll(true)}
                        >
                            Select All
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                            onClick={() => handleToggleAll(false)}
                        >
                            None
                        </Button>
                    </div>
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search workspace tools..."
                        className="h-9 pl-8 bg-neutral-900/50 border-neutral-800 text-sm focus-visible:ring-primary/30"
                    />
                </div>
                <div className="space-y-1">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Agent Model
                    </div>
                    <Select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="h-9 bg-neutral-900/50 border-neutral-800 text-sm"
                    >
                        {AVAILABLE_MODELS.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.name}
                            </option>
                        ))}
                    </Select>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredTools.map((tool) => {
                    const isEnabled = enabledToolIds.includes(tool.id);
                    return (
                        <label
                            key={tool.id}
                            className={cn(
                                "flex items-start gap-3 p-2.5 rounded-lg border transition-all cursor-pointer group",
                                isEnabled
                                    ? "bg-primary/5 border-primary/20"
                                    : "border-transparent hover:bg-neutral-800/50"
                            )}
                        >
                            <div className={cn(
                                "mt-0.5 size-4 rounded border flex items-center justify-center transition-colors shrink-0",
                                isEnabled ? "bg-primary border-primary text-primary-foreground" : "border-neutral-700 group-hover:border-neutral-500"
                            )}>
                                {isEnabled && <Check size={10} strokeWidth={4} />}
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={isEnabled}
                                    onChange={() => toggleToolIdForScope(scope, tool.id)}
                                />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <div className={cn(
                                    "text-xs font-semibold truncate",
                                    isEnabled ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                                )}>
                                    {tool.name}
                                </div>
                                <div className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">
                                    {tool.description}
                                </div>
                            </div>
                        </label>
                    );
                })}

                {filteredTools.length === 0 && (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                        No tools matching &quot;{query}&quot;
                    </div>
                )}
            </div>

            <div className="p-3 border-t border-border/50 bg-neutral-900/20 text-[10px] text-muted-foreground italic leading-relaxed">
                Changes apply instantly to the current playground session.
            </div>
        </div>
    );
}
