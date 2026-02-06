export type Cell = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

export type Piece = {
    t: PieceType;
    r: 0 | 1 | 2 | 3;
    x: number;
    y: number;
};

export type TetrisState = {
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

export const PIECES: Record<PieceType, number[][][]> = {
    I: [
        [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
        [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
        [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
        [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]],
    ],
    O: [
        [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
        [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
        [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
        [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    ],
    T: [
        [[0, 1, 0, 0], [1, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
        [[0, 1, 0, 0], [0, 1, 1, 0], [0, 1, 0, 0], [0, 0, 0, 0]],
        [[0, 0, 0, 0], [1, 1, 1, 0], [0, 1, 0, 0], [0, 0, 0, 0]],
        [[0, 1, 0, 0], [1, 1, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0]],
    ],
    S: [
        [[0, 1, 1, 0], [1, 1, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
        [[0, 1, 0, 0], [0, 1, 1, 0], [0, 0, 1, 0], [0, 0, 0, 0]],
        [[0, 0, 0, 0], [0, 1, 1, 0], [1, 1, 0, 0], [0, 0, 0, 0]],
        [[1, 0, 0, 0], [1, 1, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0]],
    ],
    Z: [
        [[1, 1, 0, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
        [[0, 0, 1, 0], [0, 1, 1, 0], [0, 1, 0, 0], [0, 0, 0, 0]],
        [[0, 0, 0, 0], [1, 1, 0, 0], [0, 1, 1, 0], [0, 0, 0, 0]],
        [[0, 1, 0, 0], [1, 1, 0, 0], [1, 0, 0, 0], [0, 0, 0, 0]],
    ],
    J: [
        [[1, 0, 0, 0], [1, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
        [[0, 1, 1, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0]],
        [[0, 0, 0, 0], [1, 1, 1, 0], [0, 0, 1, 0], [0, 0, 0, 0]],
        [[0, 1, 0, 0], [0, 1, 0, 0], [1, 1, 0, 0], [0, 0, 0, 0]],
    ],
    L: [
        [[0, 0, 1, 0], [1, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
        [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 1, 0], [0, 0, 0, 0]],
        [[0, 0, 0, 0], [1, 1, 1, 0], [1, 0, 0, 0], [0, 0, 0, 0]],
        [[1, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0]],
    ],
};

export const PIECE_ID: Record<PieceType, Cell> = {
    I: 1,
    O: 2,
    T: 3,
    S: 4,
    Z: 5,
    J: 6,
    L: 7,
};

export const TETRIS_ACTIONS = [
    "left",
    "right",
    "rotate_cw",
    "rotate_ccw",
    "soft_drop",
    "hard_drop",
    "none",
] as const;

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
            if (y >= 0 && y < next.length && x >= 0 && x < next[0]!.length) next[y]![x] = id;
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

export function initTetrisState(): TetrisState {
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

export type TetrisAction = { type: "reset" } | { type: "step"; action: string };

export function reduceTetris(state: TetrisState, action: TetrisAction): TetrisState {
    if (action.type === "reset") return initTetrisState();
    if (action.type !== "step") return state;
    if (state.gameOver) return state;

    const a = action.action.toLowerCase();
    const tryMove = (p: Piece) => (collides(state.board, p) ? state.piece : p);
    const tryApply = (p: Piece) => tryMove(p);

    let piece = state.piece;
    if (a === "left") piece = tryApply({ ...piece, x: piece.x - 1 });
    else if (a === "right") piece = tryApply({ ...piece, x: piece.x + 1 });
    else if (a === "rotate_cw") piece = tryApply({ ...piece, r: ((piece.r + 1) % 4) as 0 | 1 | 2 | 3 });
    else if (a === "rotate_ccw") piece = tryApply({ ...piece, r: ((piece.r + 3) % 4) as 0 | 1 | 2 | 3 });
    else if (a === "hard_drop") {
        let p = piece;
        while (!collides(state.board, { ...p, y: p.y + 1 })) p = { ...p, y: p.y + 1 };
        piece = p;
    }

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

        board = lockPiece(board, nextPiece);
        const cleared = clearLines(board);
        board = cleared.board;
        if (cleared.cleared > 0) {
            lines += cleared.cleared;
            score += [0, 100, 300, 500, 800][cleared.cleared] ?? (cleared.cleared * 200);
        }

        const spawned = spawnPiece(state.w, state.next);
        const nextType = randomPieceType();
        nextPiece = spawned;
        if (collides(board, nextPiece)) gameOver = true;

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

type LandingEvaluation = {
    targetX: number;
    targetR: 0 | 1 | 2 | 3;
    score: number;
};

type BoardStats = {
    heights: number[];
    holes: number;
    aggregateHeight: number;
    bumpiness: number;
};

function getBoardStats(board: Cell[][]): BoardStats {
    const h = board.length;
    const w = board[0]?.length ?? 0;
    const heights: number[] = Array.from({ length: w }, () => 0);
    let holes = 0;

    for (let x = 0; x < w; x++) {
        let seenBlock = false;
        for (let y = 0; y < h; y++) {
            const occupied = board[y]?.[x] !== 0;
            if (occupied && !seenBlock) {
                heights[x] = h - y;
                seenBlock = true;
            } else if (!occupied && seenBlock) {
                holes += 1;
            }
        }
    }

    let bumpiness = 0;
    for (let x = 0; x < w - 1; x++) {
        bumpiness += Math.abs(heights[x]! - heights[x + 1]!);
    }

    return {
        heights,
        holes,
        aggregateHeight: heights.reduce((s, n) => s + n, 0),
        bumpiness,
    };
}

function evaluateLanding(board: Cell[][], clearedLines: number): number {
    const stats = getBoardStats(board);
    return (
        clearedLines * 1000
        - stats.holes * 45
        - stats.aggregateHeight * 4
        - stats.bumpiness * 8
    );
}

function findBestLanding(state: TetrisState): LandingEvaluation | null {
    const candidates: LandingEvaluation[] = [];
    const minX = -2;
    const maxX = state.w + 2;

    for (let rNum = 0; rNum < 4; rNum++) {
        const r = rNum as 0 | 1 | 2 | 3;
        for (let x = minX; x <= maxX; x++) {
            let piece = { ...state.piece, r, x };
            if (collides(state.board, piece)) continue;

            while (!collides(state.board, { ...piece, y: piece.y + 1 })) {
                piece = { ...piece, y: piece.y + 1 };
            }

            const locked = lockPiece(state.board, piece);
            const cleared = clearLines(locked);
            candidates.push({
                targetX: x,
                targetR: r,
                score: evaluateLanding(cleared.board, cleared.cleared),
            });
        }
    }

    if (candidates.length === 0) return null;
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0] ?? null;
}

function nextRotationAction(current: number, target: number): "rotate_cw" | "rotate_ccw" {
    const cw = (target - current + 4) % 4;
    const ccw = (current - target + 4) % 4;
    return cw <= ccw ? "rotate_cw" : "rotate_ccw";
}

export function suggestTetrisAction(state: TetrisState): {
    action: (typeof TETRIS_ACTIONS)[number];
    targetX: number;
    targetR: 0 | 1 | 2 | 3;
    heuristicScore: number;
} {
    const landing = findBestLanding(state);
    if (!landing) {
        return {
            action: "none",
            targetX: state.piece.x,
            targetR: state.piece.r,
            heuristicScore: -999999,
        };
    }

    let action: (typeof TETRIS_ACTIONS)[number] = "none";
    if (state.piece.r !== landing.targetR) {
        action = nextRotationAction(state.piece.r, landing.targetR);
    } else if (state.piece.x < landing.targetX) {
        action = "right";
    } else if (state.piece.x > landing.targetX) {
        action = "left";
    } else {
        action = "hard_drop";
    }

    return {
        action,
        targetX: landing.targetX,
        targetR: landing.targetR,
        heuristicScore: Number(landing.score.toFixed(2)),
    };
}
