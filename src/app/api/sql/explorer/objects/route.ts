import { NextResponse } from "next/server";
import { mcpCall } from "../_mcp";

export const dynamic = "force-dynamic";

type ObjectsResult = {
    schema: string;
    tables: string[];
    views: string[];
    sequences: string[];
    extensions: string[];
};

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const schema = (searchParams.get("schema") || "public").trim() || "public";

    try {
        const result = await mcpCall<ObjectsResult>("postgres_mcp.list_objects", { schema });
        return NextResponse.json(result);
    } catch (err) {
        return NextResponse.json(
            { error: "objects_failed", message: err instanceof Error ? err.message : String(err) },
            { status: 500 }
        );
    }
}
