import { NextResponse } from "next/server";
import { mcpCall, quoteIdent } from "../_mcp";

export const dynamic = "force-dynamic";

type ObjectDetails = {
    schema: string;
    name: string;
    columns?: Array<{ name: string; type?: string; nullable?: boolean }>;
};

type ExecuteSqlResult = {
    rows?: Array<Record<string, unknown>>;
    rowCount?: number;
    mock?: boolean;
};

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
        // Fetch columns (cheap, helps us render stable column order)
        const details = await mcpCall<ObjectDetails>("postgres_mcp.get_object_details", { schema, name });
        const columns = (details.columns ?? []).map((c) => c.name).filter(Boolean);

        // Generate a safe, read-only query.
        const sql = `SELECT * FROM ${quoteIdent(schema)}.${quoteIdent(name)} LIMIT ${limit} OFFSET ${offset}`;
        const exec = await mcpCall<ExecuteSqlResult>("postgres_mcp.execute_sql", { sql });
        const rows = Array.isArray(exec.rows) ? exec.rows : [];

        // If MCP returns no column metadata, derive from first row.
        const derivedColumns = columns.length > 0 ? columns : (rows[0] ? Object.keys(rows[0]) : []);

        return NextResponse.json({
            schema,
            name,
            limit,
            offset,
            columns: derivedColumns,
            rows,
            rowCount: exec.rowCount ?? rows.length,
            mock: exec.mock ?? false,
        });
    } catch (err) {
        return NextResponse.json(
            { error: "table_failed", message: err instanceof Error ? err.message : String(err) },
            { status: 500 }
        );
    }
}
