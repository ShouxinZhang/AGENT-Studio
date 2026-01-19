import { NextResponse } from "next/server";

type MovieRow = {
    id: number;
    title: string;
    year: number;
    rating: number;
    director: string;
};

const MOVIES: MovieRow[] = [
    { id: 1, title: "The Matrix", year: 1999, rating: 8.7, director: "The Wachowskis" },
    { id: 2, title: "Inception", year: 2010, rating: 8.8, director: "Christopher Nolan" },
    { id: 3, title: "Spirited Away", year: 2001, rating: 8.6, director: "Hayao Miyazaki" },
    { id: 4, title: "Interstellar", year: 2014, rating: 8.7, director: "Christopher Nolan" },
    { id: 5, title: "Parasite", year: 2019, rating: 8.5, director: "Bong Joon-ho" },
];

function isSelectOnly(sql: string): boolean {
    const normalized = sql.trim().toLowerCase();
    if (!normalized) return false;
    if (!normalized.startsWith("select")) return false;
    // ultra-simple guard: reject multiple statements
    if (normalized.includes(";")) return false;
    return true;
}

function parseLimit(sql: string): number | undefined {
    const m = sql.toLowerCase().match(/\blimit\s+(\d+)\b/);
    if (!m) return undefined;
    const n = Number(m[1]);
    if (!Number.isFinite(n) || n <= 0) return undefined;
    return Math.min(100, n);
}

function parseWhereId(sql: string): number | undefined {
    const m = sql.toLowerCase().match(/\bwhere\s+id\s*=\s*(\d+)\b/);
    if (!m) return undefined;
    const n = Number(m[1]);
    if (!Number.isFinite(n) || n <= 0) return undefined;
    return n;
}

export async function POST(req: Request) {
    const { sql } = (await req.json().catch(() => ({}))) as { sql?: string };

    if (typeof sql !== "string" || !isSelectOnly(sql)) {
        return NextResponse.json(
            {
                error: "only_select_queries_supported",
                hint: "Try: SELECT * FROM movies LIMIT 5",
            },
            { status: 400 }
        );
    }

    const normalized = sql.toLowerCase();
    if (!normalized.includes("from movies")) {
        return NextResponse.json(
            {
                error: "only_movies_table_supported",
                schema: {
                    table: "movies",
                    columns: ["id", "title", "year", "rating", "director"],
                },
            },
            { status: 400 }
        );
    }

    const whereId = parseWhereId(sql);
    const limit = parseLimit(sql);

    let rows = MOVIES;
    if (typeof whereId === "number") {
        rows = rows.filter((r) => r.id === whereId);
    }
    if (typeof limit === "number") {
        rows = rows.slice(0, limit);
    }

    return NextResponse.json({
        rows,
        rowCount: rows.length,
        mock: true,
        table: "movies",
    });
}

export async function GET() {
    return NextResponse.json({
        mock: true,
        table: "movies",
        rowCount: MOVIES.length,
        rows: MOVIES,
        hint: "POST /api/sql/mock/query with { sql: 'SELECT * FROM movies LIMIT 5' }",
    });
}
