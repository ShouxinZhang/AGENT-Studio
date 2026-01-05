import type { SnakeSettings, TetrisSettings } from "@/components/games/types";

export const DEFAULT_DISPLAY_SCALE = 100;

export const DEFAULT_SNAKE_SETTINGS: SnakeSettings = {
    gridSize: 15,
    speed: 120,
    allow180: false,
    wrapWalls: false,
    dieOnSelfCollision: true,
};

export const DEFAULT_TETRIS_SETTINGS: TetrisSettings = {
    speed: 500,
    startLevel: 1,
};
