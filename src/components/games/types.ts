/**
 * Game Types - 游戏类型定义
 */

// Snake 游戏场景
export type SnakeScene = {
    grid: { w: number; h: number };
    snake: number[][];
    food: number[];
    score: number;
    direction: number;
};

// Tetris 游戏场景
export type TetrisScene = {
    grid: { w: number; h: number };
    board: number[][];
    currentPiece: {
        type: string;
        color: number;
        cells: number[][];
        x: number;
        y: number;
        rotation: number;
    };
    ghostCells: number[][];
    nextPiece: {
        type: string;
        color: number;
        cells: number[][];
    };
    holdPiece: string | null;
    score: number;
    lines: number;
    level: number;
};

// 通用游戏场景类型
export type GameScene = SnakeScene | TetrisScene;

// 游戏设置
export interface SnakeSettings {
    gridSize: number;
    speed: number;
    allow180: boolean;
    wrapWalls: boolean;
    dieOnSelfCollision: boolean;
}

export interface TetrisSettings {
    speed: number;
    startLevel: number;
}

export type GameSettings = SnakeSettings | TetrisSettings;

// 渲染器 Props
export interface GameRendererProps {
    scene: GameScene | null;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

// 设置面板 Props
export interface GameSettingsProps {
    isPlaying: boolean;
    settings: GameSettings;
    onSettingsChange: (settings: GameSettings) => void;
}

// 控制面板 Props
export interface GameControlsProps {
    isPlaying: boolean;
    onAction: (action: number) => void;
}
