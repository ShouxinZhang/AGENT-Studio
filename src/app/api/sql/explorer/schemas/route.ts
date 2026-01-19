import { NextResponse } from "next/server";
import { mcpCall } from "../_mcp";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const schemas = await mcpCall<string[]>("postgres_mcp.list_schemas", {});
        return NextResponse.json({ schemas });
    } catch (err) {
        return NextResponse.json(
            { error: "schemas_failed", message: err instanceof Error ? err.message : String(err) },
            { status: 500 }
        );
    }
}
