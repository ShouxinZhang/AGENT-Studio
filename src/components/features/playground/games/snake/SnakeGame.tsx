"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { GameApi } from "../types";
import { cn } from "@/lib/utils";
import { useElementSize } from "../shared/useElementSize";
import { Button } from "@/components/ui/button";

type Pos = { x: number; y: number };

type Dir = "up" | "down" | "left" | "right";

type SnakeState = {
    gridW: number;
    gridH: number;
    snake: Pos[];
    dir: Dir;
    food: Pos;
    score: number;
    steps: number;
    gameOver: boolean;
};

function samePos(a: Pos, b: Pos) {
    return a.x === b.x && a.y === b.y;
}

function keyOf(p: Pos) {
    return `${p.x},${p.y}`;
}

function nextHead(head: Pos, dir: Dir): Pos {
    switch (dir) {
        case "up":
            return { x: head.x, y: head.y - 1 };
        case "down":
            return { x: head.x, y: head.y + 1 };
        case "left":
            return { x: head.x - 1, y: head.y };
        case "right":
            return { x: head.x + 1, y: head.y };
    }
}

function isOpposite(a: Dir, b: Dir) {
    return (
        (a === "up" && b === "down") ||
        (a === "down" && b === "up") ||
        (a === "left" && b === "right") ||
        (a === "right" && b === "left")
    );
}

function randomFood(gridW: number, gridH: number, snake: Pos[]): Pos {
    const occupied = new Set(snake.map(keyOf));
    const free: Pos[] = [];
    for (let y = 0; y < gridH; y++) {
        for (let x = 0; x < gridW; x++) {
            const p = { x, y };
            if (!occupied.has(keyOf(p))) free.push(p);
        }
    }
    if (free.length === 0) return snake[0] ?? { x: 0, y: 0 };
    return free[Math.floor(Math.random() * free.length)];
}

function initSnakeState(): SnakeState {
    const gridW = 16;
    const gridH = 16;
    const start: Pos = { x: Math.floor(gridW / 2), y: Math.floor(gridH / 2) };
    const snake = [start, { x: start.x - 1, y: start.y }, { x: start.x - 2, y: start.y }];
    return {
        gridW,
        gridH,
        snake,
        dir: "right",
        food: randomFood(gridW, gridH, snake),
        score: 0,
        steps: 0,
        gameOver: false,
    };
}

type SnakeAction =
    | { type: "reset" }
    | { type: "step"; action: string };

function reduceSnake(state: SnakeState, action: SnakeAction): SnakeState {
    if (action.type === "reset") return initSnakeState();
    if (action.type !== "step") return state;
    if (state.gameOver) return state;

    const desired = action.action.toLowerCase();
    const nextDir: Dir = (() => {
        if (desired === "up") return "up";
        if (desired === "down") return "down";
        if (desired === "left") return "left";
        if (desired === "right") return "right";
        return state.dir;
    })();

    const dir = isOpposite(state.dir, nextDir) ? state.dir : nextDir;
    const head = state.snake[0];
    if (!head) return state;

    const nh = nextHead(head, dir);
    if (nh.x < 0 || nh.x >= state.gridW || nh.y < 0 || nh.y >= state.gridH) {
        return { ...state, dir, gameOver: true, steps: state.steps + 1 };
    }

    const hitsSelf = state.snake.some((p, i) => i !== 0 && samePos(p, nh));
    if (hitsSelf) {
        return { ...state, dir, gameOver: true, steps: state.steps + 1 };
    }

    const ate = samePos(nh, state.food);
    const nextSnake = [nh, ...state.snake];
    if (!ate) nextSnake.pop();

    const nextFood = ate ? randomFood(state.gridW, state.gridH, nextSnake) : state.food;

    return {
        ...state,
        dir,
        snake: nextSnake,
        food: nextFood,
        score: ate ? state.score + 1 : state.score,
        steps: state.steps + 1,
    };
}

function drawSnake(canvas: HTMLCanvasElement, state: SnakeState, cell: number) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = state.gridW * cell;
    const h = state.gridH * cell;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, w, h);

    // Grid background
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    for (let x = 0; x <= state.gridW; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cell, 0);
        ctx.lineTo(x * cell, h);
        ctx.stroke();
    }
    for (let y = 0; y <= state.gridH; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cell);
        ctx.lineTo(w, y * cell);
        ctx.stroke();
    }

    // Food
    ctx.fillStyle = "rgba(239,68,68,0.9)";
    ctx.fillRect(state.food.x * cell + 3, state.food.y * cell + 3, cell - 6, cell - 6);

    // Snake
    ctx.fillStyle = "rgba(34,197,94,0.9)";
    for (const p of state.snake) {
        ctx.fillRect(p.x * cell + 2, p.y * cell + 2, cell - 4, cell - 4);
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

export function SnakeGame({ apiRef }: Props) {
    const [state, dispatch] = useReducer(reduceSnake, undefined, initSnakeState);
    const [started, setStarted] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const viewport = useElementSize(viewportRef);

    const cell = useMemo(() => {
        const availW = Math.max(260, viewport.width - 24);
        const availH = Math.max(260, viewport.height - 24);
        return Math.max(12, Math.floor(Math.min(availW / state.gridW, availH / state.gridH)));
    }, [state.gridH, state.gridW, viewport.height, viewport.width]);

    const api = useMemo<GameApi>(() => ({
        gameId: "Snake",
        reset: () => {
            dispatch({ type: "reset" });
            setStarted(true);
        },
        getState: () => ({
            game: "Snake",
            gridW: state.gridW,
            gridH: state.gridH,
            snake: state.snake,
            dir: state.dir,
            food: state.food,
            score: state.score,
            steps: state.steps,
            gameOver: state.gameOver,
        }),
        getActions: () => ["up", "right", "down", "left"],
        step: (action) => {
            if (!started) setStarted(true);
            dispatch({ type: "step", action });
        },
    }), [started, state]);

    useEffect(() => {
        apiRef.current = api;
        return () => {
            if (apiRef.current?.gameId === "Snake") apiRef.current = null;
        };
    }, [api, apiRef]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        drawSnake(canvas, state, cell);
    }, [cell, state]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (!started) return;
            const key = e.key.toLowerCase();
            if (key === "arrowup" || key === "w") dispatch({ type: "step", action: "up" });
            else if (key === "arrowright" || key === "d") dispatch({ type: "step", action: "right" });
            else if (key === "arrowdown" || key === "s") dispatch({ type: "step", action: "down" });
            else if (key === "arrowleft" || key === "a") dispatch({ type: "step", action: "left" });
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
                <div className="text-sm font-medium text-foreground">Snake</div>
                <div className="text-xs text-muted-foreground">Score: {state.score} · Steps: {state.steps}</div>
            </div>
            <div ref={viewportRef} className="flex-1 min-h-0 flex items-center justify-center">
                <div
                    className={cn("relative rounded-lg border border-border bg-card p-2", state.gameOver && "opacity-95")}
                    style={{ width: `${state.gridW * cell + 16}px`, height: `${state.gridH * cell + 16}px` }}
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
            <div className="shrink-0 text-xs text-muted-foreground">Keyboard: Arrow keys / WASD · Reset: R</div>
        </div>
    );
}
