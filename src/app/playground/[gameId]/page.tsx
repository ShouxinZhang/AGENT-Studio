import { notFound } from "next/navigation";
import { getGameById } from "@/lib/games/registry";
import { PlaygroundView } from "@/components/features/playground";
import type { GameId } from "@/components/features/playground/games/types";

const ALLOWED: GameId[] = ["Tetris", "Sokoban", "Snake"];

function normalizeGameId(raw: string): GameId | null {
    const lowered = raw.toLowerCase();
    const match = ALLOWED.find((id) => id.toLowerCase() === lowered);
    return match ?? null;
}

export default async function GamePlaygroundPage({ params }: { params: Promise<{ gameId: string }> }) {
    const { gameId: gameIdParam } = await params;
    const raw = decodeURIComponent(gameIdParam);
    const gameId = normalizeGameId(raw);
    if (!gameId) notFound();

    const cfg = getGameById(gameId);
    return <PlaygroundView gameId={gameId} title={cfg?.name ?? gameId} />;
}
