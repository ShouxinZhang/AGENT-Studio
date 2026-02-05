"use client";

import { useEffect, useMemo, useReducer, useRef } from "react";
import type { GameApi } from "../types";
import { cn } from "@/lib/utils";

type Cell = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

type Piece = {
    t: PieceType;
    r: 0 | 1 | 2 | 3;
    x: number;
    y: number;
};

type TetrisState = {
    w: number;
    h: number;
    board: Cell[][];
    piece: Piece;
    next: PieceType;
    score: number;
    lines: number;
    steps: number;
    gameOver: boolean;
};

const PIECES: Record<PieceType, number[][][]> = {
    I: [
        [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ],
        [
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0],
        ],
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
        ],
        [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
        ],
    ],
    O: [
        [
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ],
        [
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ],
        [
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ],
        [
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ],
    ],
    T: [
        [
            [0, 1, 0, 0],
            [1, 1, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ],
        [
            [0, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 0],
        ],
        [
            [0, 0, 0, 0],
            [1, 1, 1, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 0],
        ],
        [
            [0, 1, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 0],
        ],
    ],
    S: [
        [
            [0, 1, 1, 0],
            [1, 1, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ],
        [
            [0, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 0],
        ],
        [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [1, 1, 0, 0],
            [0, 0, 0, 0],
        ],
        [
            [1, 0, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 0],
        ],
    ],
    Z: [
        [
            [1, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ],
        [
            [0, 0, 1, 0],
            [0, 1, 1, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 0],
        ],
        [
            [0, 0, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0],
        ],
        [
            [0, 1, 0, 0],
            [1, 1, 0, 0],
            [1, 0, 0, 0],
            [0, 0, 0, 0],
        ],
    ],
    J: [
        [
            [1, 0, 0, 0],
            [1, 1, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ],
        [
            [0, 1, 1, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 0],
        ],
        [
            [0, 0, 0, 0],
            [1, 1, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 0],
        ],
        [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [1, 1, 0, 0],
            [0, 0, 0, 0],
        ],
    ],
    L: [
        [
            [0, 0, 1, 0],
            [1, 1, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ],
        [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0],
        ],
        [
            [0, 0, 0, 0],
            [1, 1, 1, 0],
            [1, 0, 0, 0],
            [0, 0, 0, 0],
        ],
        [
            [1, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 0],
        ],
    ],
};

const PIECE_ID: Record<PieceType, Cell> = {
    I: 1,
    O: 2,
    T: 3,
    S: 4,
    Z: 5,
    J: 6,
    L: 7,
};

function emptyBoard(w: number, h: number): Cell[][] {
    return Array.from({ length: h }, () => Array.from({ length: w }, () => 0 as Cell));
}

function randomPieceType(next?: PieceType): PieceType {
    if (next) return next;
    const all: PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];
    return all[Math.floor(Math.random() * all.length)];
}

function spawnPiece(w: number, nextType: PieceType): Piece {
    return { t: nextType, r: 0, x: Math.floor(w / 2) - 2, y: 0 };
}

function collides(board: Cell[][], piece: Piece): boolean {
    const shape = PIECES[piece.t][piece.r];
    for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 4; dx++) {
            if (!shape[dy]?.[dx]) continue;
            const x = piece.x + dx;
            const y = piece.y + dy;
            if (x < 0 || x >= board[0]!.length || y < 0 || y >= board.length) return true;
            if (board[y]![x] !== 0) return true;
        }
    }
    return false;
}

function lockPiece(board: Cell[][], piece: Piece): Cell[][] {
    const next = board.map((row) => row.slice()) as Cell[][];
    const shape = PIECES[piece.t][piece.r];
    const id = PIECE_ID[piece.t];
    for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 4; dx++) {
            if (!shape[dy]?.[dx]) continue;
            const x = piece.x + dx;
            const y = piece.y + dy;
            if (y >= 0 && y < next.length && x >= 0 && x < next[0]!.length) {
                next[y]![x] = id;
            }
        }
    }
    return next;
}

function clearLines(board: Cell[][]): { board: Cell[][]; cleared: number } {
    const w = board[0]!.length;
    const kept = board.filter((row) => row.some((c) => c === 0));
    const cleared = board.length - kept.length;
    const pad = Array.from({ length: cleared }, () => Array.from({ length: w }, () => 0 as Cell));
    return { board: [...pad, ...kept], cleared };
}

function initTetrisState(): TetrisState {
    const w = 10;
    const h = 20;
    const next = randomPieceType();
    const piece = spawnPiece(w, next);
    const next2 = randomPieceType();
    return {
        w,
        h,
        board: emptyBoard(w, h),
        piece,
        next: next2,
        score: 0,
        lines: 0,
        steps: 0,
        gameOver: false,
    };
}

type TetrisAction = { type: "reset" } | { type: "step"; action: string };

function reduceTetris(state: TetrisState, action: TetrisAction): TetrisState {
    if (action.type === "reset") return initTetrisState();
    if (action.type !== "step") return state;
    if (state.gameOver) return state;

    const a = action.action.toLowerCase();
    const tryMove = (p: Piece) => (collides(state.board, p) ? state.piece : p);
    const tryApply = (p: Piece) => {
        const moved = tryMove(p);
        return moved;
    };

    let piece = state.piece;
    if (a === "left") piece = tryApply({ ...piece, x: piece.x - 1 });
    else if (a === "right") piece = tryApply({ ...piece, x: piece.x + 1 });
    else if (a === "rotate_cw") piece = tryApply({ ...piece, r: ((piece.r + 1) % 4) as 0 | 1 | 2 | 3 });
    else if (a === "rotate_ccw") piece = tryApply({ ...piece, r: ((piece.r + 3) % 4) as 0 | 1 | 2 | 3 });
    else if (a === "hard_drop") {
        let p = piece;
        while (!collides(state.board, { ...p, y: p.y + 1 })) {
            p = { ...p, y: p.y + 1 };
        }
        piece = p;
    }

    // Gravity (soft_drop means apply an extra gravity step)
    const gravitySteps = a === "soft_drop" ? 2 : 1;
    let nextPiece = piece;
    let board = state.board;
    let score = state.score;
    let lines = state.lines;
    let gameOver = false;

    for (let i = 0; i < gravitySteps; i++) {
        const falling = { ...nextPiece, y: nextPiece.y + 1 };
        if (!collides(board, falling)) {
            nextPiece = falling;
            continue;
        }

        // Lock
        board = lockPiece(board, nextPiece);
        const cleared = clearLines(board);
        board = cleared.board;
        if (cleared.cleared > 0) {
            lines += cleared.cleared;
            score += [0, 100, 300, 500, 800][cleared.cleared] ?? (cleared.cleared * 200);
        }

        // Spawn
        const spawned = spawnPiece(state.w, state.next);
        const nextType = randomPieceType();
        nextPiece = spawned;
        if (collides(board, nextPiece)) {
            gameOver = true;
        }
        return {
            ...state,
            board,
            piece: nextPiece,
            next: nextType,
            score,
            lines,
            steps: state.steps + 1,
            gameOver,
        };
    }

    return {
        ...state,
        piece: nextPiece,
        score,
        lines,
        steps: state.steps + 1,
    };
}

function drawTetris(canvas: HTMLCanvasElement, state: TetrisState) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const cell = 22;
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

    // Board
    for (let y = 0; y < state.h; y++) {
        for (let x = 0; x < state.w; x++) {
            const id = state.board[y]![x]!;
            if (id !== 0) drawCell(x, y, id);
        }
    }

    // Active piece
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
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const api = useMemo<GameApi>(() => ({
        gameId: "Tetris",
        reset: () => dispatch({ type: "reset" }),
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
        getActions: () => [
            "left",
            "right",
            "rotate_cw",
            "rotate_ccw",
            "soft_drop",
            "hard_drop",
            "none",
        ],
        step: (action) => dispatch({ type: "step", action }),
    }), [state]);

    useEffect(() => {
        apiRef.current = api;
        return () => {
            if (apiRef.current?.gameId === "Tetris") apiRef.current = null;
        };
    }, [api, apiRef]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        drawTetris(canvas, state);
    }, [state]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
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
    }, []);

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="w-full flex items-center justify-between">
                <div className="text-sm font-medium text-foreground">Tetris</div>
                <div className="text-xs text-muted-foreground">Score: {state.score} · Lines: {state.lines}</div>
            </div>
            <div className={cn("rounded-lg border border-border bg-card p-2", state.gameOver && "opacity-95")}>
                <canvas ref={canvasRef} className="block" />
            </div>
            <div className="text-xs text-muted-foreground">Keyboard: ← → ↑ Z ↓ Space · Reset: R</div>
        </div>
    );
}
