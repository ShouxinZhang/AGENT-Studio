"use client";

/**
 * Snake Controls - Snake 游戏控制器
 */

import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";

interface SnakeControlsProps {
    onAction: (action: number) => void;
    disabled?: boolean;
}

export function SnakeControls({ onAction, disabled }: SnakeControlsProps) {
    return (
        <div className="w-full space-y-2">
            <div className="grid grid-cols-3 gap-2">
                <div />
                <Button
                    variant="outline"
                    className="w-full border-2 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20 py-3 text-xs"
                    onClick={() => onAction(0)}
                    disabled={disabled}
                >
                    <ArrowUp size={16} className="mr-1" /> Up
                </Button>
                <div />
            </div>
            <div className="grid grid-cols-3 gap-2">
                <Button
                    variant="outline"
                    className="w-full border-2 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20 py-3 text-xs"
                    onClick={() => onAction(3)}
                    disabled={disabled}
                >
                    <ArrowLeft size={16} className="mr-1" /> Left
                </Button>
                <Button
                    variant="outline"
                    className="w-full border-2 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20 py-3 text-xs"
                    onClick={() => onAction(2)}
                    disabled={disabled}
                >
                    <ArrowDown size={16} className="mr-1" /> Down
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

export function SnakeKeyboardHelp() {
    return (
        <div className="space-y-2">
            <HelpRow label="Up" keys={["↑", "W"]} />
            <HelpRow label="Right" keys={["→", "D"]} />
            <HelpRow label="Down" keys={["↓", "S"]} />
            <HelpRow label="Left" keys={["←", "A"]} />
        </div>
    );
}

/** Snake 键盘控制映射 */
export function handleSnakeKeyboard(key: string): number | null {
    switch (key) {
        case "ArrowUp":
        case "w":
        case "W":
            return 0;
        case "ArrowRight":
        case "d":
        case "D":
            return 1;
        case "ArrowDown":
        case "s":
        case "S":
            return 2;
        case "ArrowLeft":
        case "a":
        case "A":
            return 3;
        default:
            return null;
    }
}

/** Snake 控制说明 */
export const SNAKE_CONTROLS_HINT = "Keyboard: ↑ → ↓ ← (or WASD)";
