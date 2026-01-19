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

type ExecRows = Array<Record<string, unknown>>;

function rowsToStrings(rows: unknown, field: string): string[] {
    if (!Array.isArray(rows)) return [];
    const out: string[] = [];
    for (const r of rows as ExecRows) {
        const v = r?.[field];
        if (typeof v === "string" && v.trim()) out.push(v);
    }
    return out;
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const schema = (searchParams.get("schema") || "public").trim() || "public";

    try {
        // Use execute_sql because some postgres-mcp versions do not expose list_objects/get_object_details reliably.
        const tablesRows = await mcpCall<unknown>("postgres_mcp.execute_sql", {
            sql: `SELECT table_name FROM information_schema.tables WHERE table_schema = '${schema.replace(/'/g, "''")}' AND table_type = 'BASE TABLE' ORDER BY table_name;`,
        });

        const viewsRows = await mcpCall<unknown>("postgres_mcp.execute_sql", {
            sql: `SELECT table_name FROM information_schema.views WHERE table_schema = '${schema.replace(/'/g, "''")}' ORDER BY table_name;`,
        });

        const sequencesRows = await mcpCall<unknown>("postgres_mcp.execute_sql", {
            sql: `SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = '${schema.replace(/'/g, "''")}' ORDER BY sequence_name;`,
        });

        const extensionsRows = await mcpCall<unknown>("postgres_mcp.execute_sql", {
            sql: `SELECT extname FROM pg_extension ORDER BY extname;`,
        });

        // Each execute_sql returns an array of row objects.
        const tables = rowsToStrings(tablesRows, "table_name");
        const views = rowsToStrings(viewsRows, "table_name");
        const sequences = rowsToStrings(sequencesRows, "sequence_name");
        const extensions = rowsToStrings(extensionsRows, "extname");

        const result: ObjectsResult = { schema, tables, views, sequences, extensions };
        return NextResponse.json(result);
    } catch (err) {
        return NextResponse.json(
            { error: "objects_failed", message: err instanceof Error ? err.message : String(err) },
            { status: 500 }
        );
    }
}
