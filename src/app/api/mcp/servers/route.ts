import { NextResponse } from "next/server";

const MCP_BACKEND_URL = process.env.MCP_BACKEND_URL || "http://localhost:8090";

export async function GET() {
    const res = await fetch(`${MCP_BACKEND_URL}/mcp/servers`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
    });

    const text = await res.text();
    return new NextResponse(text, {
        status: res.status,
        headers: { "Content-Type": res.headers.get("content-type") || "application/json" },
    });
}

export async function POST(req: Request) {
    const body = await req.text();
    const res = await fetch(`${MCP_BACKEND_URL}/mcp/servers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body,
    });

    const text = await res.text();
    return new NextResponse(text, {
        status: res.status,
        headers: { "Content-Type": res.headers.get("content-type") || "application/json" },
    });
}
