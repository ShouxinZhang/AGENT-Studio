const MCP_BACKEND_URL = process.env.MCP_BACKEND_URL || "http://localhost:8090";

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function tryParseJson(text: string): unknown | null {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function pythonLiteralToJson(text: string): string {
    // Best-effort conversion of Python repr-like literals (single quotes, None/True/False)
    // to JSON. This is intentionally minimal and aimed at postgres-mcp outputs.
    let out = "";
    let i = 0;
    let inString = false;

    while (i < text.length) {
        const ch = text[i];

        if (inString) {
            if (ch === "\\") {
                // Preserve escapes.
                const next = text[i + 1];
                out += "\\\\";
                if (next !== undefined) {
                    // Escape quotes properly for JSON.
                    if (next === '"') out += '\\"';
                    else out += next;
                    i += 2;
                    continue;
                }
                i += 1;
                continue;
            }
            if (ch === "'") {
                out += '"';
                inString = false;
                i += 1;
                continue;
            }
            if (ch === '"') {
                out += '\\"';
                i += 1;
                continue;
            }
            out += ch;
            i += 1;
            continue;
        }

        if (ch === "'") {
            out += '"';
            inString = true;
            i += 1;
            continue;
        }

        // Token replacements when not inside strings.
        if (text.startsWith("None", i) && (i === 0 || !/[A-Za-z0-9_]/.test(text[i - 1] ?? "")) && !/[A-Za-z0-9_]/.test(text[i + 4] ?? "")) {
            out += "null";
            i += 4;
            continue;
        }
        if (text.startsWith("True", i) && (i === 0 || !/[A-Za-z0-9_]/.test(text[i - 1] ?? "")) && !/[A-Za-z0-9_]/.test(text[i + 4] ?? "")) {
            out += "true";
            i += 4;
            continue;
        }
        if (text.startsWith("False", i) && (i === 0 || !/[A-Za-z0-9_]/.test(text[i - 1] ?? "")) && !/[A-Za-z0-9_]/.test(text[i + 5] ?? "")) {
            out += "false";
            i += 5;
            continue;
        }

        out += ch;
        i += 1;
    }

    return out;
}

function tryParseMcpText(text: string): unknown | null {
    const trimmed = text.trim();
    if (!trimmed) return null;

    // If it's valid JSON already.
    const direct = tryParseJson(trimmed);
    if (direct !== null) return direct;

    // Try python-literal-like conversion.
    const converted = pythonLiteralToJson(trimmed);
    const parsed = tryParseJson(converted);
    if (parsed !== null) return parsed;

    return null;
}

export async function mcpCall<T>(tool: string, args: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${MCP_BACKEND_URL}/mcp/call`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ tool, args }),
        cache: "no-store",
    });

    const text = await res.text();
    let json: unknown = text;
    try {
        json = JSON.parse(text);
    } catch {
        // ignore
    }

    if (!res.ok) {
        throw new Error(`mcp_call_failed:${res.status}:${typeof json === "string" ? json : JSON.stringify(json)}`);
    }

    // postgres-mcp often returns python repr-like payloads under {text: "..."}.
    if (isRecord(json) && typeof json.text === "string") {
        const parsed = tryParseMcpText(json.text);
        if (parsed !== null) {
            return parsed as T;
        }
    }

    return json as T;
}

export function quoteIdent(ident: string): string {
    // Minimal SQL identifier quoting.
    // Escape embedded quotes by doubling.
    return `"${ident.replace(/"/g, '""')}"`;
}
