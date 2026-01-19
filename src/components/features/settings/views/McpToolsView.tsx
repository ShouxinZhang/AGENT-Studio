"use client";

import * as React from "react";
import { ArrowLeft, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { POSTGRES_MCP_TOOL_IDS, POSTGRES_MCP_TOOLS } from "@/lib/mcp/postgresMcpCatalog";
import type { ToolScope } from "@/lib/store/useSettingsStore";

type McpServerSummary = {
    id: string;
    name: string;
    type: "npm" | "pip" | "docker" | "nuget" | "remote";
};

type Props = {
    servers: McpServerSummary[];
    onBack: () => void;
    onAddServer: () => void;
    onOpenPostgresTool?: () => void;
    defaultScope?: ToolScope;
};

const SCOPE_OPTIONS: Array<{ id: ToolScope; label: string }> = [
    { id: "chat", label: "Chat" },
    { id: "sql", label: "SQL Studio" },
];

export function McpToolsView({ servers, onBack, onAddServer, onOpenPostgresTool, defaultScope = "chat" }: Props) {
    const [scope, setScope] = React.useState<ToolScope>(defaultScope);

    React.useEffect(() => {
        setScope(defaultScope);
    }, [defaultScope]);

    const enabledToolIds = useSettingsStore((s) => s.enabledToolIdsByScope?.[scope] ?? []);
    const setEnabledToolIdsForScope = useSettingsStore((s) => s.setEnabledToolIdsForScope);
    const toggleToolIdForScope = useSettingsStore((s) => s.toggleToolIdForScope);

    const [query, setQuery] = React.useState("");
    const [isBuiltInOpen, setIsBuiltInOpen] = React.useState(true);

    const queryNorm = query.trim().toLowerCase();
    const filteredPostgresTools = React.useMemo(() => {
        if (!queryNorm) return POSTGRES_MCP_TOOLS;
        return POSTGRES_MCP_TOOLS.filter((t) => {
            const hay = `${t.name} ${t.description}`.toLowerCase();
            return hay.includes(queryNorm);
        });
    }, [queryNorm]);

    const postgresSelectedCount = React.useMemo(() => {
        const enabled = new Set(enabledToolIds);
        return POSTGRES_MCP_TOOL_IDS.filter((id) => enabled.has(id)).length;
    }, [enabledToolIds]);

    const toggleAllPostgres = (nextOn: boolean) => {
        const enabled = new Set(enabledToolIds);
        if (nextOn) {
            POSTGRES_MCP_TOOL_IDS.forEach((id) => enabled.add(id));
        } else {
            POSTGRES_MCP_TOOL_IDS.forEach((id) => enabled.delete(id));
        }
        setEnabledToolIdsForScope(scope, Array.from(enabled));
    };

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
                <div className="flex-1">
                    <h3 className="font-semibold text-sm uppercase tracking-wider">MCP Tools</h3>
                    <p className="text-xs text-muted-foreground">Manage MCP server connections and tool availability per page.</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground whitespace-nowrap">Scope</div>
                        <Select
                            value={scope}
                            onChange={(e) => setScope(e.target.value as ToolScope)}
                            className="h-8 bg-secondary/40 border-border/60"
                        >
                            {SCOPE_OPTIONS.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                    {opt.label}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Select tools that are available to chat..."
                        className="bg-secondary/40 border-border/60"
                    />
                    <div className="text-xs text-muted-foreground">
                        Tools selected here apply to the chosen scope.
                    </div>
                </div>

                <Collapsible open={isBuiltInOpen} onOpenChange={setIsBuiltInOpen}>
                    <div className="rounded-xl border border-border/60 bg-secondary/20">
                        <CollapsibleTrigger asChild>
                            <button type="button" className="w-full flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold">Built-in</span>
                                    <span className="text-xs text-muted-foreground">Postgres MCP ({postgresSelectedCount}/{POSTGRES_MCP_TOOLS.length})</span>
                                </div>
                                <span className="text-muted-foreground">{isBuiltInOpen ? "▾" : "▸"}</span>
                            </button>
                        </CollapsibleTrigger>

                        <CollapsibleContent className="px-4 pb-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-muted-foreground">Postgres MCP</div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => toggleAllPostgres(true)}>
                                        Select all
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => toggleAllPostgres(false)}>
                                        Select none
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onOpenPostgresTool}
                                        disabled={!onOpenPostgresTool}
                                        title="Open Postgres MCP tool runner"
                                    >
                                        Open
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                {filteredPostgresTools.map((tool) => {
                                    const checked = enabledToolIds.includes(tool.id);
                                    return (
                                        <label
                                            key={tool.id}
                                            className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/40 px-3 py-2 hover:bg-card/60 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleToolIdForScope(scope, tool.id)}
                                                className="mt-1"
                                            />
                                            <div className="flex flex-col">
                                                <div className="text-sm font-medium text-foreground">{tool.name}</div>
                                                <div className="text-xs text-muted-foreground">{tool.description}</div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </CollapsibleContent>
                    </div>
                </Collapsible>

                {servers.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                        No MCP servers yet. Add one to enable tool calling.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {servers.map((server) => (
                            <div
                                key={server.id}
                                className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/30 px-3 py-2"
                            >
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-foreground">{server.name}</span>
                                    <span className="text-xs text-muted-foreground">{server.type}</span>
                                </div>
                                <Button variant="ghost" size="sm" className="text-muted-foreground">
                                    Manage
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-border bg-card/50">
                <Button onClick={onAddServer} className="w-full flex items-center justify-center gap-2">
                    <Plus size={16} />
                    Add MCP Server
                </Button>
            </div>
        </div>
    );
}
