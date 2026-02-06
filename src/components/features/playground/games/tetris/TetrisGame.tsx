"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { GameApi } from "../types";
import { cn } from "@/lib/utils";
import { useElementSize } from "../shared/useElementSize";
import { Button } from "@/components/ui/button";
import {
    PIECES,
    PIECE_ID,
    TETRIS_ACTIONS,
    initTetrisState,
    reduceTetris,
    type TetrisState,
} from "./tetrisCore";

function drawTetris(canvas: HTMLCanvasElement, state: TetrisState, cell: number) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = state.w * cell;
    const h = state.h * cell;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(0, 0, w, h);

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
        ctx.fillStyle = colors[id] ?? "rgba(255,255,255,0.7)";
        ctx.fillRect(x * cell + 2, y * cell + 2, cell - 4, cell - 4);
    };

    for (let y = 0; y < state.h; y++) {
        for (let x = 0; x < state.w; x++) {
            const id = state.board[y]![x]!;
            if (id !== 0) drawCell(x, y, id);
        }
    }

    const shape = PIECES[state.piece.t][state.piece.r];
    const id = PIECE_ID[state.piece.t];
    for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 4; dx++) {
            if (!shape[dy]?.[dx]) continue;
            const x = state.piece.x + dx;
            const y = state.piece.y + dy;
            if (y >= 0) drawCell(x, y, id);
        }
    }

    if (state.gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.font = "bold 20px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", w / 2, h / 2);
    }
}

type Props = {
    apiRef: React.MutableRefObject<GameApi | null>;
};

export function TetrisGame({ apiRef }: Props) {
    const [state, dispatch] = useReducer(reduceTetris, undefined, initTetrisState);
    const [started, setStarted] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const viewport = useElementSize(viewportRef);

    const cell = useMemo(() => {
        const availW = Math.max(220, viewport.width - 24);
        const availH = Math.max(320, viewport.height - 24);
        return Math.max(14, Math.floor(Math.min(availW / state.w, availH / state.h)));
    }, [state.h, state.w, viewport.height, viewport.width]);

    const api = useMemo<GameApi>(() => ({
        gameId: "Tetris",
        reset: () => {
            dispatch({ type: "reset" });
            setStarted(true);
        },
        getState: () => ({
            game: "Tetris",
            w: state.w,
            h: state.h,
            board: state.board,
            piece: state.piece,
            next: state.next,
            score: state.score,
            lines: state.lines,
            steps: state.steps,
            gameOver: state.gameOver,
        }),
        getActions: () => [...TETRIS_ACTIONS],
        step: (action) => {
            if (!started) setStarted(true);
            dispatch({ type: "step", action });
        },
    }), [started, state]);

    useEffect(() => {
        apiRef.current = api;
        return () => {
            if (apiRef.current?.gameId === "Tetris") apiRef.current = null;
        };
    }, [api, apiRef]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        drawTetris(canvas, state, cell);
    }, [cell, state]);

    useEffect(() => {
        if (!started || state.gameOver) return;
        const timer = window.setInterval(() => {
            dispatch({ type: "step", action: "none" });
        }, 650);
        return () => window.clearInterval(timer);
    }, [started, state.gameOver]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (!started) return;
            const key = e.key.toLowerCase();
            if (key === "arrowleft") dispatch({ type: "step", action: "left" });
            else if (key === "arrowright") dispatch({ type: "step", action: "right" });
            else if (key === "arrowup") dispatch({ type: "step", action: "rotate_cw" });
            else if (key === "z") dispatch({ type: "step", action: "rotate_ccw" });
            else if (key === "arrowdown") dispatch({ type: "step", action: "soft_drop" });
            else if (key === " ") dispatch({ type: "step", action: "hard_drop" });
            else if (key === "r") dispatch({ type: "reset" });
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [started]);

    const showStartOverlay = !started || state.gameOver;
    const startLabel = started ? "重新开始" : "开始游戏";

    return (
        <div className="flex h-full w-full flex-col gap-3">
            <div className="shrink-0 w-full flex items-center justify-between">
                <div className="text-sm font-medium text-foreground">Tetris</div>
                <div className="text-xs text-muted-foreground">Score: {state.score} · Lines: {state.lines}</div>
            </div>
            <div ref={viewportRef} className="flex-1 min-h-0 flex items-center justify-center">
                <div
                    className={cn("relative rounded-lg border border-border bg-card p-2", state.gameOver && "opacity-95")}
                    style={{ width: `${state.w * cell + 16}px`, height: `${state.h * cell + 16}px` }}
                >
                    <canvas ref={canvasRef} className="block" />
                    {showStartOverlay && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                            <Button
                                onClick={() => {
                                    dispatch({ type: "reset" });
                                    setStarted(true);
                                }}
                            >
                                {startLabel}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
            <div className="shrink-0 text-xs text-muted-foreground">Keyboard: ← → ↑ Z ↓ Space · Reset: R</div>
        </div>
    );
}
