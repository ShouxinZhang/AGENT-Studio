import { NextResponse } from "next/server";
import { mcpCall, quoteIdent } from "../_mcp";

export const dynamic = "force-dynamic";

type ExecRows = Array<Record<string, unknown>>;

function asRows(value: unknown): ExecRows {
    return Array.isArray(value) ? (value as ExecRows) : [];
}

function escapeSqlString(value: string): string {
    return value.replace(/'/g, "''");
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const schema = (searchParams.get("schema") || "public").trim() || "public";
    const name = (searchParams.get("name") || "").trim();

    const limitRaw = searchParams.get("limit");
    const offsetRaw = searchParams.get("offset");

    const limit = Math.max(1, Math.min(200, Number(limitRaw ?? 100) || 100));
    const offset = Math.max(0, Number(offsetRaw ?? 0) || 0);

    if (!name) {
        return NextResponse.json({ error: "missing_name" }, { status: 400 });
    }

    try {
        // Fetch columns via information_schema for stable ordering.
        const columnsRows = await mcpCall<unknown>("postgres_mcp.execute_sql", {
            sql: `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = '${escapeSqlString(schema)}' AND table_name = '${escapeSqlString(name)}' ORDER BY ordinal_position;`,
        });
        const columns = asRows(columnsRows)
            .map((r) => (typeof r.column_name === "string" ? r.column_name : ""))
            .filter(Boolean);

        // Generate a safe, read-only query.
        const sql = `SELECT * FROM ${quoteIdent(schema)}.${quoteIdent(name)} LIMIT ${limit} OFFSET ${offset}`;
        const rows = asRows(await mcpCall<unknown>("postgres_mcp.execute_sql", { sql }));

        // If MCP returns no column metadata, derive from first row.
        const derivedColumns = columns.length > 0 ? columns : (rows[0] ? Object.keys(rows[0]) : []);

        return NextResponse.json({
            schema,
            name,
            limit,
            offset,
            columns: derivedColumns,
            rows,
            rowCount: rows.length,
            mock: false,
        });
    } catch (err) {
        return NextResponse.json(
            { error: "table_failed", message: err instanceof Error ? err.message : String(err) },
            { status: 500 }
        );
    }
}
