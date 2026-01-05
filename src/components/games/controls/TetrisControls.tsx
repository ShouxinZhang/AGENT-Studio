"use client";

/**
 * Tetris Controls - 俄罗斯方块控制器
 */

import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowLeft, ArrowRight, RotateCcw, RotateCw, ChevronsDown } from "lucide-react";

interface TetrisControlsProps {
    onAction: (action: number) => void;
    disabled?: boolean;
}

export function TetrisControls({ onAction, disabled }: TetrisControlsProps) {
    return (
        <div className="w-full space-y-3">
            <div className="grid grid-cols-2 gap-2">
                <Button
                    variant="outline"
                    className="w-full border-2 border-purple-500/50 text-purple-300 hover:bg-purple-500/20 py-3 text-xs"
                    onClick={() => onAction(3)}
                    disabled={disabled}
                >
                    <RotateCcw size={16} className="mr-1" /> CCW
                </Button>
                <Button
                    variant="outline"
                    className="w-full border-2 border-purple-500/50 text-purple-300 hover:bg-purple-500/20 py-3 text-xs"
                    onClick={() => onAction(2)}
                    disabled={disabled}
                >
                    CW <RotateCw size={16} className="ml-1" />
                </Button>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <Button
                    variant="outline"
                    className="w-full border-2 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20 py-3 text-xs"
                    onClick={() => onAction(0)}
                    disabled={disabled}
                >
                    <ArrowLeft size={16} className="mr-1" /> Left
                </Button>
                <Button
                    variant="outline"
                    className="w-full border-2 border-yellow-500/50 text-yellow-300 hover:bg-yellow-500/20 py-3 text-xs"
                    onClick={() => onAction(4)}
                    disabled={disabled}
                >
                    <ArrowDown size={16} className="mr-1" /> Drop
                </Button>
                <Button
                    variant="outline"
                    className="w-full border-2 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20 py-3 text-xs"
                    onClick={() => onAction(1)}
                    disabled={disabled}
                >
                    Right <ArrowRight size={16} className="ml-1" />
                </Button>
            </div>

            <Button
                variant="outline"
                className="w-full border-2 border-red-500/50 text-red-300 hover:bg-red-500/20 py-3 text-xs"
                onClick={() => onAction(5)}
                disabled={disabled}
            >
                <ChevronsDown size={16} className="mr-1" /> HARD DROP
            </Button>
        </div>
    );
}

function Keycap({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-[11px] text-gray-200">
            {children}
        </span>
    );
}

function HelpRow({ label, keys }: { label: string; keys: React.ReactNode[] }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-400">{label}</span>
            <div className="flex flex-wrap justify-end gap-1">
                {keys.map((k, idx) => (
                    <Keycap key={idx}>{k}</Keycap>
                ))}
            </div>
        </div>
    );
}

export function TetrisKeyboardHelp() {
    return (
        <div className="space-y-2">
            <HelpRow label="Move" keys={["←", "→", "A", "D"]} />
            <HelpRow label="Rotate CW" keys={["↑", "X"]} />
            <HelpRow label="Rotate CCW" keys={["Z"]} />
            <HelpRow label="Soft Drop" keys={["↓", "S"]} />
            <HelpRow label="Hard Drop" keys={["Space"]} />
        </div>
    );
}

/** Tetris 键盘控制映射 */
export function handleTetrisKeyboard(key: string): number | null {
    switch (key) {
        case "ArrowLeft":
        case "a":
        case "A":
            return 0; // Move Left
        case "ArrowRight":
        case "d":
        case "D":
            return 1; // Move Right
        case "ArrowUp":
        case "x":
        case "X":
            return 2; // Rotate CW
        case "z":
        case "Z":
        case "Control":
            return 3; // Rotate CCW
        case "ArrowDown":
        case "s":
        case "S":
            return 4; // Soft Drop
        case " ":
            return 5; // Hard Drop
        default:
            return null;
    }
}

/** Tetris 控制说明 */
export const TETRIS_CONTROLS_HINT = "← → (move) | ↑/X (rotate CW) | Z (CCW) | ↓ (soft) | Space (hard drop)";
