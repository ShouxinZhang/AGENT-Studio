"use client";

import { useEffect, useMemo, useReducer, useRef } from "react";
import type { GameApi } from "../types";
import { cn } from "@/lib/utils";
import { useElementSize } from "../shared/useElementSize";

type Pos = { x: number; y: number };
type Dir = "up" | "down" | "left" | "right";

type SokobanState = {
    w: number;
    h: number;
    walls: Set<string>;
    targets: Set<string>;
    boxes: Set<string>;
    player: Pos;
    moves: number;
    won: boolean;
};

function keyOf(p: Pos) {
    return `${p.x},${p.y}`;
}

function fromKey(k: string): Pos {
    const [x, y] = k.split(",").map((n) => Number(n));
    return { x, y };
}

function add(p: Pos, d: Dir): Pos {
    switch (d) {
        case "up":
            return { x: p.x, y: p.y - 1 };
        case "down":
            return { x: p.x, y: p.y + 1 };
        case "left":
            return { x: p.x - 1, y: p.y };
        case "right":
            return { x: p.x + 1, y: p.y };
    }
}

const LEVEL = [
    "##########",
    "#..     .#",
    "#  $$  @ #",
    "#   ##   #",
    "#        #",
    "##########",
];

function initSokobanState(): SokobanState {
    const h = LEVEL.length;
    const w = Math.max(...LEVEL.map((r) => r.length));

    const walls = new Set<string>();
    const targets = new Set<string>();
    const boxes = new Set<string>();
    let player: Pos = { x: 1, y: 1 };

    for (let y = 0; y < h; y++) {
        const row = LEVEL[y] ?? "";
        for (let x = 0; x < w; x++) {
            const ch = row[x] ?? " ";
            const k = `${x},${y}`;
            if (ch === "#") walls.add(k);
            if (ch === ".") targets.add(k);
            if (ch === "$") boxes.add(k);
            if (ch === "@") player = { x, y };
        }
    }

    const won = Array.from(boxes).every((b) => targets.has(b));

    return { w, h, walls, targets, boxes, player, moves: 0, won };
}

type SokobanAction = { type: "reset" } | { type: "step"; action: string };

function reduceSokoban(state: SokobanState, action: SokobanAction): SokobanState {
    if (action.type === "reset") return initSokobanState();
    if (action.type !== "step") return state;
    if (state.won) return state;

    const desired = action.action.toLowerCase();
    const dir: Dir | null =
        desired === "up" ? "up" :
        desired === "down" ? "down" :
        desired === "left" ? "left" :
        desired === "right" ? "right" : null;
    if (!dir) return state;

    const nextPlayer = add(state.player, dir);
    const npKey = keyOf(nextPlayer);

    if (state.walls.has(npKey)) return state;

    const boxes = new Set(state.boxes);
    if (boxes.has(npKey)) {
        const beyond = add(nextPlayer, dir);
        const bKey = keyOf(beyond);
        if (state.walls.has(bKey) || boxes.has(bKey)) return state;
        boxes.delete(npKey);
        boxes.add(bKey);
    }

    const won = Array.from(boxes).every((b) => state.targets.has(b));
    return {
        ...state,
        boxes,
        player: nextPlayer,
        moves: state.moves + 1,
        won,
    };
}

function drawSokoban(canvas: HTMLCanvasElement, state: SokobanState, cell: number) {
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

    const drawRect = (x: number, y: number, fill: string) => {
        ctx.fillStyle = fill;
        ctx.fillRect(x * cell + 2, y * cell + 2, cell - 4, cell - 4);
    };

    // Walls
    ctx.fillStyle = "rgba(148,163,184,0.8)";
    for (const k of state.walls) {
        const p = fromKey(k);
        drawRect(p.x, p.y, "rgba(148,163,184,0.75)");
    }

    // Targets
    for (const k of state.targets) {
        const p = fromKey(k);
        ctx.strokeStyle = "rgba(250,204,21,0.8)";
        ctx.strokeRect(p.x * cell + 6, p.y * cell + 6, cell - 12, cell - 12);
    }

    // Boxes
    for (const k of state.boxes) {
        const p = fromKey(k);
        const onTarget = state.targets.has(k);
        drawRect(p.x, p.y, onTarget ? "rgba(34,197,94,0.85)" : "rgba(249,115,22,0.85)");
    }

    // Player
    drawRect(state.player.x, state.player.y, "rgba(59,130,246,0.9)");

    if (state.won) {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.font = "bold 20px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("YOU WIN", w / 2, h / 2);
    }
}

type Props = {
    apiRef: React.MutableRefObject<GameApi | null>;
};

export function SokobanGame({ apiRef }: Props) {
    const [state, dispatch] = useReducer(reduceSokoban, undefined, initSokobanState);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const viewport = useElementSize(viewportRef);

    const cell = useMemo(() => {
        const availW = Math.max(260, viewport.width - 24);
        const availH = Math.max(220, viewport.height - 24);
        return Math.max(14, Math.floor(Math.min(availW / state.w, availH / state.h)));
    }, [state.h, state.w, viewport.height, viewport.width]);

    const api = useMemo<GameApi>(() => ({
        gameId: "Sokoban",
        reset: () => dispatch({ type: "reset" }),
        getState: () => ({
            game: "Sokoban",
            w: state.w,
            h: state.h,
            player: state.player,
            boxes: Array.from(state.boxes),
            targets: Array.from(state.targets),
            walls: Array.from(state.walls),
            moves: state.moves,
            won: state.won,
        }),
        getActions: () => ["up", "right", "down", "left"],
        step: (action) => dispatch({ type: "step", action }),
    }), [state]);

    useEffect(() => {
        apiRef.current = api;
        return () => {
            if (apiRef.current?.gameId === "Sokoban") apiRef.current = null;
        };
    }, [api, apiRef]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        drawSokoban(canvas, state, cell);
    }, [cell, state]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (key === "arrowup" || key === "w") dispatch({ type: "step", action: "up" });
            else if (key === "arrowright" || key === "d") dispatch({ type: "step", action: "right" });
            else if (key === "arrowdown" || key === "s") dispatch({ type: "step", action: "down" });
            else if (key === "arrowleft" || key === "a") dispatch({ type: "step", action: "left" });
            else if (key === "r") dispatch({ type: "reset" });
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    return (
        <div className="flex h-full w-full flex-col gap-3">
            <div className="shrink-0 w-full flex items-center justify-between">
                <div className="text-sm font-medium text-foreground">Sokoban</div>
                <div className="text-xs text-muted-foreground">Moves: {state.moves}{state.won ? " · Solved" : ""}</div>
            </div>
            <div ref={viewportRef} className="flex-1 min-h-0 flex items-center justify-center">
                <div
                    className={cn("rounded-lg border border-border bg-card p-2", state.won && "opacity-95")}
                    style={{ width: `${state.w * cell + 16}px`, height: `${state.h * cell + 16}px` }}
                >
                    <canvas ref={canvasRef} className="block" />
                </div>
            </div>
            <div className="shrink-0 text-xs text-muted-foreground">Keyboard: Arrow keys / WASD · Reset: R</div>
        </div>
    );
}
