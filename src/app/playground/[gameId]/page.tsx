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

type PageProps = {
    params: Promise<{ gameId: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeAutoRunFlag(raw: string | string[] | undefined): boolean {
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value) return false;
    const v = value.toLowerCase();
    return v === "1" || v === "true" || v === "yes" || v === "on";
}

export default async function GamePlaygroundPage({ params, searchParams }: PageProps) {
    const { gameId: gameIdParam } = await params;
    const qs = searchParams ? await searchParams : {};
    const raw = decodeURIComponent(gameIdParam);
    const gameId = normalizeGameId(raw);
    if (!gameId) notFound();

    const autoRun = normalizeAutoRunFlag(qs.autorun ?? qs.autoRun);
    const cfg = getGameById(gameId);
    return <PlaygroundView gameId={gameId} title={cfg?.name ?? gameId} autoRun={autoRun} />;
}
