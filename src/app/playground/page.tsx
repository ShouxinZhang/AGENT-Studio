import Link from "next/link";
import { getGameById } from "@/lib/games/registry";

const PLAYGROUND_GAMES = ["Tetris", "Sokoban", "Snake"] as const;

export default function PlaygroundHomePage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-6 py-10">
                <h1 className="text-2xl font-semibold text-foreground">Game Playground</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Client-side games with a right-side agent chat.
                </p>

                <div className="mt-8 grid gap-3">
                    {PLAYGROUND_GAMES.map((id) => {
                        const cfg = getGameById(id);
                        return (
                            <Link
                                key={id}
                                href={`/playground/${encodeURIComponent(id)}`}
                                className="rounded-lg border border-border bg-card p-4 hover:bg-secondary/60 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="text-xl">{cfg?.emoji ?? "🎮"}</div>
                                        <div>
                                            <div className="text-sm font-medium text-foreground">{cfg?.name ?? id}</div>
                                            <div className="text-xs text-muted-foreground">{cfg?.description ?? ""}</div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">Open →</div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
