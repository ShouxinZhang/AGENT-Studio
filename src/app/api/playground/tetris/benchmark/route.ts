import { NextResponse } from "next/server";
import { runTetrisMcpBenchmark } from "@/components/features/playground/mcp/runTetrisMcpBenchmark";
import { DEFAULT_MODEL_ID } from "@/lib/config/llm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const model = typeof body?.model === "string" && body.model.trim()
            ? body.model.trim()
            : DEFAULT_MODEL_ID;
        const episodes = typeof body?.episodes === "number" ? body.episodes : 3;
        const maxTurns = typeof body?.maxTurns === "number" ? body.maxTurns : 180;

        const apiKey = process.env.OPENROUTER_API_KEY?.trim();
        if (!apiKey) {
            return NextResponse.json(
                { ok: false, error: "OPENROUTER_API_KEY is not configured" },
                { status: 500 }
            );
        }

        const result = await runTetrisMcpBenchmark({
            apiKey,
            model,
            episodes,
            maxTurns,
        });

        return NextResponse.json({
            ok: true,
            ...result,
        });
    } catch (e) {
        return NextResponse.json(
            {
                ok: false,
                error: e instanceof Error ? e.message : "benchmark_failed",
            },
            { status: 500 }
        );
    }
}

