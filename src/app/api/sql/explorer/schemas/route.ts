import { NextResponse } from "next/server";
import { mcpCall } from "../_mcp";

export const dynamic = "force-dynamic";

function normalizeSchemas(value: unknown): string[] {
    if (Array.isArray(value)) {
        // Already an array of schema names.
        if (value.every((v) => typeof v === "string")) return value as string[];
        // Common case: array of objects with schema_name.
        return value
            .map((v) => (typeof v === "object" && v !== null ? (v as Record<string, unknown>).schema_name : undefined))
            .filter((v): v is string => typeof v === "string");
    }
    return [];
}

export async function GET() {
    try {
        const raw = await mcpCall<unknown>("postgres_mcp.list_schemas", {});
        const schemas = normalizeSchemas(raw);
        return NextResponse.json({ schemas });
    } catch (err) {
        return NextResponse.json(
            { error: "schemas_failed", message: err instanceof Error ? err.message : String(err) },
            { status: 500 }
        );
    }
}
