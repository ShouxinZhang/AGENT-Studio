import type { ExtractedMcpToolRequest } from "./types";

function tryParseJsonObject(raw: string): Record<string, unknown> | null {
    try {
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
        return parsed as Record<string, unknown>;
    } catch {
        return null;
    }
}

export function extractLatestMcpToolRequest(text: string): ExtractedMcpToolRequest | null {
    // Protocol: assistant emits a JSON object inside a fenced code block:
    // ```mcp
    // {"tool":"game.get_state","args":{}}
    // ```
    const re = /```mcp\s*([\s\S]*?)```/gi;
    let match: RegExpExecArray | null = null;
    let last: RegExpExecArray | null = null;
    while ((match = re.exec(text))) {
        last = match;
    }
    if (!last) return null;

    const raw = (last[1] ?? "").trim();
    if (!raw) return null;

    const obj = tryParseJsonObject(raw);
    if (!obj) return null;

    const tool = typeof obj.tool === "string" ? obj.tool.trim() : "";
    if (!tool) return null;

    const argsCandidate = obj.args;
    const args = (argsCandidate && typeof argsCandidate === "object" && !Array.isArray(argsCandidate))
        ? (argsCandidate as Record<string, unknown>)
        : undefined;

    return { request: { tool, args }, raw };
}
