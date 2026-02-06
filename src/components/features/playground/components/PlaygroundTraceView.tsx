"use client";

import * as React from "react";
import type { UIMessage } from "ai";
import { Brain, ChevronLeft, ChevronRight, Pause, Play, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMessageText } from "@/components/features/chat";
import { extractLatestMcpToolRequest } from "@/components/features/playground/mcp/extractMcpRequest";
import { PIECES, PIECE_ID, type Cell, type Piece } from "@/components/features/playground/games/tetris/tetrisCore";
import type { GameId } from "@/components/features/playground/games/types";

type Props = {
    gameId: GameId;
    messages: UIMessage[];
};

type McpResultPayload = {
    ok: boolean;
    tool: string;
    game?: string;
    result?: unknown;
    error?: string;
};

type TetrisSnapshot = {
    index: number;
    tool: string;
    score: number;
    lines: number;
    board: Cell[][];
    piece: Piece;
};

type TraceEvent = {
    id: string;
    type: "request" | "result" | "reasoning";
    title: string;
    detail: string;
};

function parseMcpResultFromText(text: string): McpResultPayload | null {
    if (!text.startsWith("[MCP_RESULT]")) return null;

    let content = text.replace("[MCP_RESULT]", "").trim();
    const block = content.match(/^```json\s*([\s\S]*?)\s*```$/i);
    if (block?.[1]) content = block[1].trim();

    try {
        const parsed = JSON.parse(content) as Partial<McpResultPayload>;
        if (!parsed || typeof parsed !== "object") return null;
        if (typeof parsed.tool !== "string") return null;
        return {
            ok: Boolean(parsed.ok),
            tool: parsed.tool,
            game: typeof parsed.game === "string" ? parsed.game : undefined,
            result: parsed.result,
            error: typeof parsed.error === "string" ? parsed.error : undefined,
        };
    } catch {
        return null;
    }
}

function isBoard(v: unknown): v is Cell[][] {
    return Array.isArray(v) && v.every((row) => Array.isArray(row));
}

function isPiece(v: unknown): v is Piece {
    if (!v || typeof v !== "object") return false;
    const o = v as Record<string, unknown>;
    return (
        typeof o.t === "string" &&
        typeof o.r === "number" &&
        typeof o.x === "number" &&
        typeof o.y === "number"
    );
}

function toTetrisSnapshot(payload: McpResultPayload, index: number): TetrisSnapshot | null {
    if (!payload.ok) return null;

    const raw = payload.result;
    const root = (raw && typeof raw === "object") ? (raw as Record<string, unknown>) : null;
    if (!root) return null;

    const stateCandidate = root.state && typeof root.state === "object"
        ? (root.state as Record<string, unknown>)
        : root;

    if (!isBoard(stateCandidate.board) || !isPiece(stateCandidate.piece)) return null;

    const score = typeof stateCandidate.score === "number" ? stateCandidate.score : 0;
    const lines = typeof stateCandidate.lines === "number" ? stateCandidate.lines : 0;

    return {
        index,
        tool: payload.tool,
        score,
        lines,
        board: stateCandidate.board,
        piece: stateCandidate.piece,
    };
}

function drawTetrisSnapshot(canvas: HTMLCanvasElement, snapshot: TetrisSnapshot) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width <= 0 || height <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const gridW = snapshot.board[0]?.length ?? 10;
    const gridH = snapshot.board.length || 20;
    const cell = Math.floor(Math.min(width / gridW, height / gridH));
    const renderW = cell * gridW;
    const renderH = cell * gridH;
    const offX = Math.floor((width - renderW) / 2);
    const offY = Math.floor((height - renderH) / 2);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(offX, offY, renderW, renderH);

    const colors = [
        "rgba(0,0,0,0)",
        "rgba(59,130,246,0.9)",
        "rgba(234,179,8,0.9)",
        "rgba(168,85,247,0.9)",
        "rgba(34,197,94,0.9)",
        "rgba(239,68,68,0.9)",
        "rgba(249,115,22,0.9)",
        "rgba(14,165,233,0.9)",
    ];

    const drawCell = (x: number, y: number, id: number) => {
        const px = offX + x * cell;
        const py = offY + y * cell;
        ctx.fillStyle = colors[id] ?? "rgba(255,255,255,0.7)";
        ctx.fillRect(px + 1, py + 1, cell - 2, cell - 2);
    };

    for (let y = 0; y < gridH; y++) {
        for (let x = 0; x < gridW; x++) {
            const id = snapshot.board[y]?.[x] ?? 0;
            if (id !== 0) drawCell(x, y, id);
        }
    }

    const shape = PIECES[snapshot.piece.t][snapshot.piece.r];
    const pieceId = PIECE_ID[snapshot.piece.t];
    for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 4; dx++) {
            if (!shape[dy]?.[dx]) continue;
            const x = snapshot.piece.x + dx;
            const y = snapshot.piece.y + dy;
            if (x >= 0 && x < gridW && y >= 0 && y < gridH) {
                drawCell(x, y, pieceId);
            }
        }
    }
}

export function PlaygroundTraceView({ gameId, messages }: Props) {
    const { traceEvents, snapshots, reasoningEntries } = React.useMemo(() => {
        const events: TraceEvent[] = [];
        const snaps: TetrisSnapshot[] = [];
        const thoughts: string[] = [];

        messages.forEach((message, i) => {
            if (message.role === "assistant") {
                const text = getMessageText(message);
                const req = extractLatestMcpToolRequest(text);
                if (req) {
                    events.push({
                        id: `req-${message.id}-${i}`,
                        type: "request",
                        title: req.request.tool,
                        detail: JSON.stringify(req.request.args ?? {}, null, 2),
                    });
                }

                for (const part of message.parts) {
                    if (part.type === "reasoning" && part.text.trim()) {
                        thoughts.push(part.text.trim());
                    }
                }
            }

            if (message.role === "user") {
                const text = getMessageText(message);
                const payload = parseMcpResultFromText(text);
                if (!payload) return;

                events.push({
                    id: `res-${message.id}-${i}`,
                    type: "result",
                    title: payload.tool,
                    detail: payload.ok ? "ok" : (payload.error ?? "failed"),
                });

                if (gameId === "Tetris") {
                    const snapshot = toTetrisSnapshot(payload, i);
                    if (snapshot) snaps.push(snapshot);
                }
            }
        });

        return {
            traceEvents: events.reverse(),
            snapshots: snaps,
            reasoningEntries: thoughts.reverse(),
        };
    }, [gameId, messages]);

    const [cursor, setCursor] = React.useState(0);
    const [playing, setPlaying] = React.useState(false);
    const [liveMode, setLiveMode] = React.useState(true);
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

    React.useEffect(() => {
        if (liveMode && snapshots.length > 0) {
            setCursor(snapshots.length - 1);
        } else if (cursor > snapshots.length - 1) {
            setCursor(Math.max(0, snapshots.length - 1));
        }
    }, [cursor, liveMode, snapshots.length]);

    React.useEffect(() => {
        if (!playing) return;
        const timer = window.setInterval(() => {
            setCursor((prev) => {
                const next = prev + 1;
                if (next >= snapshots.length) {
                    setPlaying(false);
                    return Math.max(0, snapshots.length - 1);
                }
                return next;
            });
        }, 420);
        return () => window.clearInterval(timer);
    }, [playing, snapshots.length]);

    const current = snapshots[cursor] ?? null;

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !current) return;
        drawTetrisSnapshot(canvas, current);
    }, [current]);

    return (
        <div className="flex h-full flex-col overflow-hidden bg-background">
            <div className="border-b border-border/50 p-3 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    LLM Trace
                </div>
                <div className="text-xs text-muted-foreground">
                    MCP 调用历史、思考片段与{gameId}实时回放。
                </div>
            </div>

            {gameId === "Tetris" && (
                <div className="border-b border-border/40 p-3 space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Replay</div>
                    <div className="rounded-lg border border-border/60 bg-black/30 p-2">
                        <canvas ref={canvasRef} className="block h-[220px] w-full rounded" />
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                                setLiveMode(false);
                                setPlaying(false);
                                setCursor((c) => Math.max(0, c - 1));
                            }}
                            disabled={snapshots.length === 0}
                        >
                            <ChevronLeft size={14} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                                setLiveMode(false);
                                setPlaying((p) => !p);
                            }}
                            disabled={snapshots.length === 0}
                        >
                            {playing ? <Pause size={14} /> : <Play size={14} />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                                setLiveMode(false);
                                setPlaying(false);
                                setCursor((c) => Math.min(Math.max(0, snapshots.length - 1), c + 1));
                            }}
                            disabled={snapshots.length === 0}
                        >
                            <ChevronRight size={14} />
                        </Button>
                        <Button
                            variant={liveMode ? "default" : "outline"}
                            size="sm"
                            className="h-7 px-2 text-[10px]"
                            onClick={() => {
                                setLiveMode(true);
                                setPlaying(false);
                                if (snapshots.length > 0) setCursor(snapshots.length - 1);
                            }}
                        >
                            <Radio size={12} className="mr-1" /> Live
                        </Button>
                        <div className="ml-auto text-[10px] text-muted-foreground">
                            {snapshots.length === 0
                                ? "no snapshot"
                                : `${cursor + 1}/${snapshots.length} · score ${current?.score ?? 0} · lines ${current?.lines ?? 0}`}
                        </div>
                    </div>
                    <input
                        type="range"
                        className="w-full"
                        min={0}
                        max={Math.max(0, snapshots.length - 1)}
                        value={Math.min(cursor, Math.max(0, snapshots.length - 1))}
                        onChange={(e) => {
                            setLiveMode(false);
                            setPlaying(false);
                            setCursor(Number(e.target.value));
                        }}
                        disabled={snapshots.length === 0}
                    />
                </div>
            )}

            <div className="grid min-h-0 flex-1 grid-rows-2 gap-0">
                <div className="min-h-0 border-b border-border/40">
                    <div className="p-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        MCP 调用历史
                    </div>
                    <div className="h-[calc(100%-28px)] overflow-y-auto p-2 space-y-1">
                        {traceEvents.length === 0 ? (
                            <div className="text-xs text-muted-foreground">还没有 MCP 调用记录。</div>
                        ) : (
                            traceEvents.map((e) => (
                                <div key={e.id} className="rounded border border-border/50 bg-neutral-900/30 p-2">
                                    <div className="text-xs font-semibold text-foreground">{e.title}</div>
                                    <div className="mt-0.5 text-[10px] text-muted-foreground line-clamp-3">{e.detail}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="min-h-0">
                    <div className="flex items-center gap-1 p-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        <Brain size={12} /> 思考片段
                    </div>
                    <div className="h-[calc(100%-28px)] overflow-y-auto p-2 space-y-1">
                        {reasoningEntries.length === 0 ? (
                            <div className="text-xs text-muted-foreground">极速模式下可能不返回原始思考内容。</div>
                        ) : (
                            reasoningEntries.map((text, idx) => (
                                <div key={`thought-${idx}`} className="rounded border border-border/50 bg-neutral-900/30 p-2 text-[10px] text-muted-foreground whitespace-pre-wrap">
                                    {text}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
