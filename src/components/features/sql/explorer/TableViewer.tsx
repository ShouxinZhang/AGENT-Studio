"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Table as TableIcon } from "lucide-react";
import type { DbObjectRef, TablePage } from "./types";

type Props = {
    selection: DbObjectRef | null;
};

export function TableViewer({ selection }: Props) {
    const [page, setPage] = React.useState<TablePage | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const [limit, setLimit] = React.useState(100);
    const [offset, setOffset] = React.useState(0);

    React.useEffect(() => {
        setOffset(0);
    }, [selection?.schema, selection?.name, selection?.type]);

    const load = React.useCallback(async () => {
        if (!selection) return;
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                schema: selection.schema,
                name: selection.name,
                limit: String(limit),
                offset: String(offset),
            });
            const res = await fetch(`/api/sql/explorer/table?${params.toString()}`, { cache: "no-store" });
            const data = (await res.json()) as TablePage & { error?: string; message?: string };
            if (!res.ok) throw new Error(data.message || data.error || "table_failed");
            setPage(data);
        } catch (e) {
            setPage(null);
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setIsLoading(false);
        }
    }, [selection, limit, offset]);

    React.useEffect(() => {
        void load();
    }, [load]);

    if (!selection) {
        return (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Select a table to view data.
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="h-12 shrink-0 border-b border-white/5 flex items-center px-4 gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-100">
                    <TableIcon size={16} className="text-emerald-400" />
                    <span className="truncate">{selection.schema}.{selection.name}</span>
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <button
                        type="button"
                        className="p-1.5 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground"
                        onClick={() => void load()}
                        title="Refresh"
                        disabled={isLoading}
                    >
                        <RefreshCw size={16} />
                    </button>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Rows</span>
                        <input
                            type="number"
                            min={1}
                            max={200}
                            value={limit}
                            onChange={(e) => setLimit(Math.max(1, Math.min(200, Number(e.target.value) || 100)))}
                            className="w-16 rounded bg-white/5 border border-white/10 px-2 py-1 text-xs text-slate-100"
                        />
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            className="p-1.5 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground"
                            onClick={() => setOffset((o) => Math.max(0, o - limit))}
                            disabled={isLoading || offset <= 0}
                            title="Previous page"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            type="button"
                            className="p-1.5 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground"
                            onClick={() => setOffset((o) => o + limit)}
                            disabled={isLoading}
                            title="Next page"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                {error && (
                    <div className="m-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {error}
                    </div>
                )}

                {isLoading && !page ? (
                    <div className="p-4 text-sm text-muted-foreground">Loading…</div>
                ) : null}

                {page && (
                    <div className="min-w-[720px]">
                        <div className="sticky top-0 z-10 grid grid-flow-col auto-cols-[minmax(160px,1fr)] bg-[#0d0d15] border-b border-white/10">
                            {page.columns.map((c) => (
                                <div key={c} className="px-3 py-2 text-xs font-semibold text-slate-200 border-r border-white/5 truncate">
                                    {c}
                                </div>
                            ))}
                        </div>

                        {page.rows.length === 0 ? (
                            <div className="p-4 text-sm text-muted-foreground">No rows.</div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {page.rows.map((row, idx) => (
                                    <div
                                        key={idx}
                                        className="grid grid-flow-col auto-cols-[minmax(160px,1fr)] hover:bg-white/[0.03]"
                                    >
                                        {page.columns.map((c) => (
                                            <div
                                                key={c}
                                                className="px-3 py-2 text-xs text-slate-200 border-r border-white/5 truncate"
                                                title={String(row[c] ?? "")}
                                            >
                                                {formatCell(row[c])}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="p-3 text-xs text-muted-foreground border-t border-white/5 flex items-center justify-between">
                            <span>
                                Offset {offset} • Limit {limit}
                                {page.mock ? " • mock" : ""}
                            </span>
                            <span>Returned {page.rowCount} rows</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function formatCell(value: unknown): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}
