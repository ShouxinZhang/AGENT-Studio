import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { SnakeSettings, TetrisSettings } from "@/components/games/types";
import {
    DEFAULT_DISPLAY_SCALE,
    DEFAULT_SNAKE_SETTINGS,
    DEFAULT_TETRIS_SETTINGS,
} from "@/lib/config/playgroundDefaults";
import { DEFAULT_MODEL_ID } from "@/lib/config/llm";

export interface PlaygroundSettingsState {
    model: string;
    displayScale: number;
    snakeSettings: SnakeSettings;
    tetrisSettings: TetrisSettings;
    setModel: (model: string) => void;
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
            model: DEFAULT_MODEL_ID,
            displayScale: DEFAULT_DISPLAY_SCALE,
            snakeSettings: DEFAULT_SNAKE_SETTINGS,
            tetrisSettings: DEFAULT_TETRIS_SETTINGS,
            setModel: (model) => set({ model: model.trim() || DEFAULT_MODEL_ID }),
            setDisplayScale: (displayScale) => set({ displayScale: clampScale(displayScale) }),
            setSnakeSettings: (snakeSettings) => set({ snakeSettings }),
            setTetrisSettings: (tetrisSettings) => set({ tetrisSettings }),
            resetToDefaults: () =>
                set({
                    model: DEFAULT_MODEL_ID,
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
                model: state.model,
                displayScale: state.displayScale,
                snakeSettings: state.snakeSettings,
                tetrisSettings: state.tetrisSettings,
            }),
        }
    )
);
