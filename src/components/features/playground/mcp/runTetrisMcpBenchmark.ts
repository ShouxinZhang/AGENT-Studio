import { callGameTool, getGameToolSpecs } from "./gameMcpTools";
import { extractLatestMcpToolRequest } from "./extractMcpRequest";
import { initTetrisState, reduceTetris, TETRIS_ACTIONS, type TetrisState } from "../games/tetris/tetrisCore";
import type { GameApi } from "../games/types";

type ChatRole = "system" | "user" | "assistant";

type ChatMessage = {
    role: ChatRole;
    content: string;
};

export type TetrisEpisodeResult = {
    model: string;
    finalScore: number;
    finalLines: number;
    finalSteps: number;
    gameOver: boolean;
    turns: number;
    toolCalls: number;
    invalidToolResponses: number;
    durationMs: number;
    scorePerMinute: number;
    avgModelLatencyMs: number;
    toolHistogram: Record<string, number>;
    sampledStepActions: string[];
    error?: string;
};

export type TetrisBenchmarkSummary = {
    model: string;
    episodes: number;
    avgScore: number;
    medianScore: number;
    bestScore: number;
    worstScore: number;
    avgLines: number;
    avgScorePerMinute: number;
    normalScoreEstimate: number;
};

export type TetrisBenchmarkResult = {
    summary: TetrisBenchmarkSummary;
    episodes: TetrisEpisodeResult[];
};

function buildTetrisAgentSystemPrompt() {
    const tools = getGameToolSpecs("Tetris")
        .map((spec) => `- ${spec.tool} (args: ${JSON.stringify(spec.argsExample)}) -> ${spec.description}`)
        .join("\n");

    return [
        "You are a high-speed Tetris game agent.",
        "Your objective is maximize score and lines with fast reactions.",
        "You MUST output EXACTLY ONE MCP tool request each assistant turn.",
        "Output format strictly:",
        "```mcp",
        "{\"tool\":\"tetris.get_state\",\"args\":{}}",
        "```",
        "Never output explanations during play.",
        "Available tools:",
        tools,
        `Valid actions for tetris.step are: ${TETRIS_ACTIONS.join(", ")}`,
        "Policy hints:",
        "- Prefer loop: tetris.auto_step({\"repeat\":3}) to react quickly.",
        "- Fallback loop: tetris.suggest_action then tetris.step with returned action.",
        "- Keep stack low and flat.",
        "- Avoid creating holes under blocks.",
        "- Prefer hard_drop when alignment is ready.",
        "- If uncertain, call tetris.get_state then choose a safe action.",
    ].join("\n");
}

function toTextContent(content: unknown): string {
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
        return content
            .map((part) => {
                if (!part || typeof part !== "object") return "";
                const p = part as Record<string, unknown>;
                if (typeof p.text === "string") return p.text;
                return "";
            })
            .filter(Boolean)
            .join("\n");
    }
    return "";
}

async function callOpenRouterChat(args: {
    apiKey: string;
    model: string;
    messages: ChatMessage[];
    timeoutMs?: number;
}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), args.timeoutMs ?? 15000);
    let res: Response;
    try {
        res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${args.apiKey}`,
            },
            body: JSON.stringify({
                model: args.model,
                messages: args.messages,
                temperature: 0.2,
                top_p: 0.95,
                max_tokens: 120,
            }),
            cache: "no-store",
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timeout);
    }

    const text = await res.text();
    let json: unknown = null;
    try {
        json = JSON.parse(text);
    } catch {
        throw new Error(`openrouter_invalid_json:${text.slice(0, 200)}`);
    }

    if (!res.ok) {
        throw new Error(`openrouter_error:${res.status}:${JSON.stringify(json).slice(0, 400)}`);
    }

    const root = json as Record<string, unknown>;
    const choices = root.choices;
    if (!Array.isArray(choices) || choices.length === 0) {
        throw new Error("openrouter_no_choices");
    }

    const first = choices[0] as Record<string, unknown>;
    const message = first.message as Record<string, unknown> | undefined;
    const content = toTextContent(message?.content);
    if (!content.trim()) throw new Error("openrouter_empty_content");
    return content;
}

function buildTetrisApi() {
    let state: TetrisState = initTetrisState();

    const api: GameApi = {
        gameId: "Tetris",
        reset: () => {
            state = initTetrisState();
        },
        getState: () => state,
        getActions: () => [...TETRIS_ACTIONS],
        step: (action) => {
            state = reduceTetris(state, { type: "step", action });
        },
    };

    return {
        api,
        getState: () => state,
    };
}

function summarizeScores(model: string, episodes: TetrisEpisodeResult[]): TetrisBenchmarkSummary {
    const scores = episodes.map((e) => e.finalScore).sort((a, b) => a - b);
    const lines = episodes.map((e) => e.finalLines);
    const spm = episodes.map((e) => e.scorePerMinute);
    const avgScore = scores.reduce((s, x) => s + x, 0) / Math.max(1, scores.length);
    const avgLines = lines.reduce((s, x) => s + x, 0) / Math.max(1, lines.length);
    const avgScorePerMinute = spm.reduce((s, x) => s + x, 0) / Math.max(1, spm.length);
    const medianScore = scores.length === 0
        ? 0
        : scores[Math.floor((scores.length - 1) / 2)] ?? 0;

    return {
        model,
        episodes: episodes.length,
        avgScore: Number(avgScore.toFixed(2)),
        medianScore,
        bestScore: scores[scores.length - 1] ?? 0,
        worstScore: scores[0] ?? 0,
        avgLines: Number(avgLines.toFixed(2)),
        avgScorePerMinute: Number(avgScorePerMinute.toFixed(2)),
        normalScoreEstimate: Math.round((avgScore * 0.7) + (medianScore * 0.3)),
    };
}

export async function runTetrisMcpEpisode(args: {
    apiKey: string;
    model: string;
    maxTurns?: number;
}): Promise<TetrisEpisodeResult> {
    const startedAt = Date.now();
    const maxTurns = Math.max(12, Math.min(240, args.maxTurns ?? 64));
    const maxDurationMs = 90000;
    const { api, getState } = buildTetrisApi();

    let turns = 0;
    let toolCalls = 0;
    let invalidToolResponses = 0;
    let totalModelLatencyMs = 0;
    let bestScore = 0;
    let stagnantSteps = 0;
    const toolHistogram: Record<string, number> = {};
    const sampledStepActions: string[] = [];

    const messages: ChatMessage[] = [
        { role: "system", content: buildTetrisAgentSystemPrompt() },
        { role: "user", content: "Start Tetris now. Use tetris.auto_step({\"repeat\":3}) immediately and keep scoring." },
    ];

    try {
        while (turns < maxTurns) {
            const reqStart = Date.now();
            const assistantText = await callOpenRouterChat({
                apiKey: args.apiKey,
                model: args.model,
                messages,
                timeoutMs: 15000,
            });
            totalModelLatencyMs += Date.now() - reqStart;
            turns += 1;

            messages.push({ role: "assistant", content: assistantText });
            const extracted = extractLatestMcpToolRequest(assistantText);
            if (!extracted) {
                invalidToolResponses += 1;
                messages.push({
                    role: "user",
                    content: "Invalid response. Emit exactly one MCP tool code block now.",
                });
                continue;
            }

            const result = await callGameTool(extracted.request, api);
            toolCalls += 1;
            const toolName = extracted.request.tool;
            toolHistogram[toolName] = (toolHistogram[toolName] ?? 0) + 1;
            if (toolName === "tetris.step" || toolName === "game.step") {
                const action = typeof extracted.request.args?.action === "string"
                    ? extracted.request.args.action
                    : "none";
                if (sampledStepActions.length < 30) sampledStepActions.push(action);
            }
            messages.push({
                role: "user",
                content: `[MCP_RESULT]\\n\\n\\\`\\\`\\\`json\\n${JSON.stringify({ ok: true, tool: extracted.request.tool, result }, null, 2)}\\n\\\`\\\`\\\``,
            });

            if (messages.length > 40) {
                const system = messages[0];
                const tail = messages.slice(-30);
                messages.length = 0;
                messages.push(system, ...tail);
            }

            const state = getState();
            if (state.score > bestScore) {
                bestScore = state.score;
                stagnantSteps = 0;
            } else {
                stagnantSteps += 1;
            }
            if (state.gameOver) break;
            if (stagnantSteps >= 120) break;
            if (Date.now() - startedAt > maxDurationMs) break;
        }
    } catch (e) {
        const state = getState();
        const durationMs = Date.now() - startedAt;
        return {
            model: args.model,
            finalScore: state.score,
            finalLines: state.lines,
            finalSteps: state.steps,
            gameOver: state.gameOver,
            turns,
            toolCalls,
            invalidToolResponses,
            durationMs,
            scorePerMinute: durationMs > 0 ? Number(((state.score * 60000) / durationMs).toFixed(2)) : 0,
            avgModelLatencyMs: turns > 0 ? Number((totalModelLatencyMs / turns).toFixed(2)) : 0,
            toolHistogram,
            sampledStepActions,
            error: e instanceof Error ? e.message : "benchmark_failed",
        };
    }

    const state = getState();
    const durationMs = Date.now() - startedAt;
    return {
        model: args.model,
        finalScore: state.score,
        finalLines: state.lines,
        finalSteps: state.steps,
        gameOver: state.gameOver,
        turns,
        toolCalls,
        invalidToolResponses,
        durationMs,
        scorePerMinute: durationMs > 0 ? Number(((state.score * 60000) / durationMs).toFixed(2)) : 0,
        avgModelLatencyMs: turns > 0 ? Number((totalModelLatencyMs / turns).toFixed(2)) : 0,
        toolHistogram,
        sampledStepActions,
    };
}

export async function runTetrisMcpBenchmark(args: {
    apiKey: string;
    model: string;
    episodes?: number;
    maxTurns?: number;
}): Promise<TetrisBenchmarkResult> {
    const episodes = Math.max(1, Math.min(10, args.episodes ?? 3));
    const results: TetrisEpisodeResult[] = [];

    for (let i = 0; i < episodes; i++) {
        const r = await runTetrisMcpEpisode({
            apiKey: args.apiKey,
            model: args.model,
            maxTurns: args.maxTurns,
        });
        results.push(r);
    }

    return {
        summary: summarizeScores(args.model, results),
        episodes: results,
    };
}
