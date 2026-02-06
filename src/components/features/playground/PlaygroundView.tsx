"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { GameApi, GameId } from "./games/types";
import { SnakeGame } from "./games/snake/SnakeGame";
import { TetrisGame } from "./games/tetris/TetrisGame";
import { SokobanGame } from "./games/sokoban/SokobanGame";
import { PlaygroundChatInterface } from "./PlaygroundChatInterface";

type Props = {
    gameId: GameId;
    title?: string;
    autoRun?: boolean;
};

export function PlaygroundView({ gameId, title, autoRun = false }: Props) {
    const apiRef = useRef<GameApi | null>(null);

    const gameView = useMemo(() => {
        switch (gameId) {
            case "Snake":
                return <SnakeGame apiRef={apiRef} />;
            case "Tetris":
                return <TetrisGame apiRef={apiRef} />;
            case "Sokoban":
                return <SokobanGame apiRef={apiRef} />;
            default:
                return null;
        }
    }, [gameId]);

    return (
        <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
            <header className="h-12 border-b border-border flex items-center px-4 bg-card z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <Link
                        href="/playground"
                        className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        ← Back
                    </Link>
                    <div className="text-sm font-semibold text-foreground">{title ?? gameId}</div>
                </div>
                <div className="ml-auto text-xs text-muted-foreground">Left: Game · Right: LLM Chat</div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <main className="flex-1 min-w-0 min-h-0 p-2 md:p-4 bg-neutral-900/50">
                    <div className="w-full h-full">{gameView}</div>
                </main>

                <aside
                    className={cn(
                        "w-[clamp(300px,26vw,420px)] border-l border-border bg-card flex flex-col overflow-hidden",
                        "min-w-[280px]"
                    )}
                >
                    <div className="flex-1 min-h-0">
                        <PlaygroundChatInterface gameId={gameId} apiRef={apiRef} autoRun={autoRun} />
                    </div>
                </aside>
            </div>
        </div>
    );
}
