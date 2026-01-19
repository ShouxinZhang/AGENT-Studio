"use client";

import * as React from "react";
import { ArrowLeft, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { POSTGRES_MCP_TOOLS } from "@/lib/mcp/postgresMcpCatalog";

type QueryResponse = {
    ok: true;
    tool: string;
    result: unknown;
} | {
    ok: false;
    tool: string;
    error: string;
    hint?: string;
};

type Props = {
    onBack: () => void;
};

export function PostgresMcpToolView({ onBack }: Props) {
    const [toolName, setToolName] = React.useState(POSTGRES_MCP_TOOLS[0]?.name || "list_schemas");
    const activeTool = React.useMemo(() => POSTGRES_MCP_TOOLS.find((t) => t.name === toolName), [toolName]);

    const asRecord = (value: unknown): Record<string, unknown> | null => {
        if (typeof value !== "object" || value === null) return null;
        return value as Record<string, unknown>;
    };

    const [argsJson, setArgsJson] = React.useState(() => {
        const sample = activeTool?.sampleArgs ?? {};
        return JSON.stringify(sample, null, 2);
    });

    React.useEffect(() => {
        const sample = activeTool?.sampleArgs ?? {};
        setArgsJson(JSON.stringify(sample, null, 2));
    }, [activeTool?.sampleArgs]);

    const [isRunning, setIsRunning] = React.useState(false);
    const [result, setResult] = React.useState<QueryResponse | null>(null);

    const run = async () => {
        setIsRunning(true);
        try {
            let args: unknown = {};
            try {
                args = argsJson.trim() ? JSON.parse(argsJson) : {};
            } catch {
                setResult({ ok: false, tool: toolName, error: "invalid_json", hint: "Args must be valid JSON." });
                return;
            }

            // Demo runner (mock). When we wire real MCP calls, this becomes a tool-call proxy.
            if (toolName === "execute_sql") {
                const argsObj = asRecord(args);
                const sql = typeof argsObj?.sql === "string" ? argsObj.sql : "";
                const res = await fetch("/api/sql/mock/query", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sql }),
                });
                const data = (await res.json()) as unknown;
                if (!res.ok) {
                    setResult({ ok: false, tool: toolName, error: "execute_sql_failed", hint: JSON.stringify(data) });
                } else {
                    setResult({ ok: true, tool: toolName, result: data });
                }
                return;
            }

            if (toolName === "list_schemas") {
                setResult({ ok: true, tool: toolName, result: ["public"] });
                return;
            }

            if (toolName === "list_objects") {
                const argsObj = asRecord(args);
                const schemaRaw = argsObj?.schema;
                const schema = typeof schemaRaw === "string" && schemaRaw.trim() ? schemaRaw : "public";
                setResult({
                    ok: true,
                    tool: toolName,
                    result: {
                        schema,
                        tables: ["movies"],
                        views: [],
                        sequences: [],
                        extensions: [],
                    },
                });
                return;
            }

            if (toolName === "get_object_details") {
                const argsObj = asRecord(args);
                const schemaRaw = argsObj?.schema;
                const nameRaw = argsObj?.name;
                const schema = typeof schemaRaw === "string" && schemaRaw.trim() ? schemaRaw : "public";
                const name = typeof nameRaw === "string" && nameRaw.trim() ? nameRaw : "movies";
                setResult({
                    ok: true,
                    tool: toolName,
                    result: {
                        schema,
                        name,
                        columns: [
                            { name: "id", type: "integer", nullable: false },
                            { name: "title", type: "text", nullable: false },
                            { name: "year", type: "integer", nullable: false },
                            { name: "rating", type: "numeric(3,1)", nullable: false },
                            { name: "director", type: "text", nullable: false },
                        ],
                        indexes: [{ name: "movies_pkey", columns: ["id"], unique: true }],
                        constraints: [{ name: "movies_pkey", type: "PRIMARY KEY" }],
                    },
                });
                return;
            }

            // Everything else is a stub for now (shows the tool list is real).
            setResult({
                ok: true,
                tool: toolName,
                result: {
                    mock: true,
                    message: "This tool is stubbed in the mock runner. Wire real postgres-mcp to execute it.",
                    args,
                },
            });
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-card text-card-foreground border-l border-border animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-border flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8" title="Back">
                    <ArrowLeft size={18} />
                </Button>
                <div className="flex-1">
                    <h3 className="font-semibold text-sm uppercase tracking-wider">Postgres MCP Tool</h3>
                    <p className="text-xs text-muted-foreground">Mock DB: table movies (5 rows)</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Tool</Label>
                        <select
                            value={toolName}
                            onChange={(e) => setToolName(e.target.value)}
                            className="w-full rounded-md bg-secondary/40 border border-border/60 px-3 py-2 text-sm"
                        >
                            {POSTGRES_MCP_TOOLS.map((t) => (
                                <option key={t.id} value={t.name}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                        {activeTool?.description && (
                            <div className="text-xs text-muted-foreground">{activeTool.description}</div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Args (JSON)</Label>
                        <Textarea
                            value={argsJson}
                            onChange={(e) => setArgsJson(e.target.value)}
                            className="bg-secondary border-none min-h-[140px]"
                            spellCheck={false}
                        />
                    </div>
                </div>

                {result && !result.ok && (
                    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                        {result.error}
                        {result.hint && <div className="text-xs text-muted-foreground mt-1">Hint: {result.hint}</div>}
                    </div>
                )}

                {result && result.ok && (
                    <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">Result</div>
                        <pre className="whitespace-pre-wrap rounded-lg border border-border/60 bg-secondary/20 p-3 text-xs text-foreground/90">
                            {JSON.stringify(result.result, null, 2)}
                        </pre>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-border bg-card/50">
                <Button onClick={run} className="w-full flex items-center justify-center gap-2" disabled={isRunning}>
                    <Play size={16} />
                    {isRunning ? "Running..." : "Run Query"}
                </Button>
            </div>
        </div>
    );
}
