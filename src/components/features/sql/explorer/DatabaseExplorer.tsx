"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, Database, Table as TableIcon, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DbObjectRef } from "./types";

type ObjectsResult = {
    schema: string;
    tables: string[];
    views: string[];
    sequences: string[];
    extensions: string[];
};

type Props = {
    onSelectObject: (ref: DbObjectRef) => void;
};

export function DatabaseExplorer({ onSelectObject }: Props) {
    const [schemas, setSchemas] = React.useState<string[]>([]);
    const [expandedSchemas, setExpandedSchemas] = React.useState<Record<string, boolean>>({});
    const [objectsBySchema, setObjectsBySchema] = React.useState<Record<string, ObjectsResult | null>>({});
    const [loadingSchemas, setLoadingSchemas] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const loadSchemas = React.useCallback(async () => {
        setLoadingSchemas(true);
        setError(null);
        try {
            const res = await fetch("/api/sql/explorer/schemas", { cache: "no-store" });
            const data = (await res.json()) as { schemas?: string[]; error?: string; message?: string };
            if (!res.ok) throw new Error(data.message || data.error || "schemas_failed");
            setSchemas(Array.isArray(data.schemas) ? data.schemas : []);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoadingSchemas(false);
        }
    }, []);

    const loadObjects = React.useCallback(async (schema: string) => {
        setObjectsBySchema((prev) => ({ ...prev, [schema]: prev[schema] ?? null }));
        try {
            const res = await fetch(`/api/sql/explorer/objects?schema=${encodeURIComponent(schema)}`, { cache: "no-store" });
            const data = (await res.json()) as ObjectsResult & { error?: string; message?: string };
            if (!res.ok) throw new Error(data.message || data.error || "objects_failed");
            setObjectsBySchema((prev) => ({ ...prev, [schema]: data }));
        } catch (e) {
            setObjectsBySchema((prev) => ({ ...prev, [schema]: { schema, tables: [], views: [], sequences: [], extensions: [] } }));
            setError(e instanceof Error ? e.message : String(e));
        }
    }, []);

    React.useEffect(() => {
        void loadSchemas();
    }, [loadSchemas]);

    const toggleSchema = async (schema: string) => {
        setExpandedSchemas((prev) => ({ ...prev, [schema]: !prev[schema] }));
        const nextOpen = !expandedSchemas[schema];
        if (nextOpen && objectsBySchema[schema] === undefined) {
            await loadObjects(schema);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-3 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Database size={14} /> Database
                </div>
                <button
                    type="button"
                    onClick={() => void loadSchemas()}
                    className="text-xs text-muted-foreground hover:text-foreground"
                    title="Refresh"
                    disabled={loadingSchemas}
                >
                    ↻
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {error && (
                    <div className="mb-2 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs text-destructive">
                        {error}
                    </div>
                )}

                {loadingSchemas && schemas.length === 0 ? (
                    <div className="p-2 text-xs text-muted-foreground">Loading schemas…</div>
                ) : null}

                {schemas.length === 0 && !loadingSchemas ? (
                    <div className="p-2 text-xs text-muted-foreground">No schemas.</div>
                ) : null}

                <div className="space-y-1">
                    {schemas.map((schema) => {
                        const isOpen = !!expandedSchemas[schema];
                        const obj = objectsBySchema[schema];
                        const isLoadingObjects = obj === null;

                        return (
                            <div key={schema} className="select-none">
                                <button
                                    type="button"
                                    className={cn(
                                        "w-full flex items-center gap-2 rounded-md px-2 py-1 text-sm",
                                        "hover:bg-white/5 text-slate-200"
                                    )}
                                    onClick={() => void toggleSchema(schema)}
                                >
                                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    <span className="truncate">{schema}</span>
                                </button>

                                {isOpen && (
                                    <div className="ml-6 mt-1 space-y-1">
                                        {isLoadingObjects ? (
                                            <div className="text-xs text-muted-foreground px-2 py-1">Loading…</div>
                                        ) : (
                                            <>
                                                <div className="text-[11px] uppercase tracking-wider text-muted-foreground px-2 pt-1">Tables</div>
                                                {(obj?.tables ?? []).map((t) => (
                                                    <button
                                                        key={`${schema}.table.${t}`}
                                                        type="button"
                                                        className="w-full flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-white/5 text-slate-200"
                                                        onClick={() => onSelectObject({ schema, name: t, type: "table" })}
                                                    >
                                                        <TableIcon size={14} className="text-emerald-400" />
                                                        <span className="truncate">{t}</span>
                                                    </button>
                                                ))}
                                                {(obj?.tables?.length ?? 0) === 0 ? (
                                                    <div className="text-xs text-muted-foreground px-2 py-1">(none)</div>
                                                ) : null}

                                                <div className="text-[11px] uppercase tracking-wider text-muted-foreground px-2 pt-2">Views</div>
                                                {(obj?.views ?? []).map((v) => (
                                                    <button
                                                        key={`${schema}.view.${v}`}
                                                        type="button"
                                                        className="w-full flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-white/5 text-slate-200"
                                                        onClick={() => onSelectObject({ schema, name: v, type: "view" })}
                                                    >
                                                        <Eye size={14} className="text-blue-400" />
                                                        <span className="truncate">{v}</span>
                                                    </button>
                                                ))}
                                                {(obj?.views?.length ?? 0) === 0 ? (
                                                    <div className="text-xs text-muted-foreground px-2 py-1">(none)</div>
                                                ) : null}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
