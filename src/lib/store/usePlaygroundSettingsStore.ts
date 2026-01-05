import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { SnakeSettings, TetrisSettings } from "@/components/games/types";
import {
    DEFAULT_DISPLAY_SCALE,
    DEFAULT_SNAKE_SETTINGS,
    DEFAULT_TETRIS_SETTINGS,
} from "@/lib/config/playgroundDefaults";

export interface PlaygroundSettingsState {
    displayScale: number;
    snakeSettings: SnakeSettings;
    tetrisSettings: TetrisSettings;
    setDisplayScale: (scale: number) => void;
    setSnakeSettings: (settings: SnakeSettings) => void;
    setTetrisSettings: (settings: TetrisSettings) => void;
    resetToDefaults: () => void;
}

function clampScale(scale: number): number {
    if (!Number.isFinite(scale)) return DEFAULT_DISPLAY_SCALE;
    return Math.min(160, Math.max(50, scale));
}

export const usePlaygroundSettingsStore = create<PlaygroundSettingsState>()(
    persist(
        (set) => ({
            displayScale: DEFAULT_DISPLAY_SCALE,
            snakeSettings: DEFAULT_SNAKE_SETTINGS,
            tetrisSettings: DEFAULT_TETRIS_SETTINGS,
            setDisplayScale: (displayScale) => set({ displayScale: clampScale(displayScale) }),
            setSnakeSettings: (snakeSettings) => set({ snakeSettings }),
            setTetrisSettings: (tetrisSettings) => set({ tetrisSettings }),
            resetToDefaults: () =>
                set({
                    displayScale: DEFAULT_DISPLAY_SCALE,
                    snakeSettings: DEFAULT_SNAKE_SETTINGS,
                    tetrisSettings: DEFAULT_TETRIS_SETTINGS,
                }),
        }),
        {
            name: "agent-studio-playground-settings",
            version: 1,
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                displayScale: state.displayScale,
                snakeSettings: state.snakeSettings,
                tetrisSettings: state.tetrisSettings,
            }),
        }
    )
);
