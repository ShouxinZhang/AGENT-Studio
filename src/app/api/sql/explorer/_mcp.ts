const MCP_BACKEND_URL = process.env.MCP_BACKEND_URL || "http://localhost:8090";

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

    return json as T;
}

export function quoteIdent(ident: string): string {
    // Minimal SQL identifier quoting.
    // Escape embedded quotes by doubling.
    return `"${ident.replace(/"/g, '""')}"`;
}
