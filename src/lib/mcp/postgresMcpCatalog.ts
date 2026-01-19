export type McpToolDef = {
    id: string;
    name: string;
    description: string;
    sampleArgs?: Record<string, unknown>;
};

// Catalog for crystaldba/postgres-mcp tools (used for UI + mock runner).
// Names/descriptions mirror the upstream README tool list.
export const POSTGRES_MCP_TOOLS: McpToolDef[] = [
    {
        id: "postgres_mcp.list_schemas",
        name: "list_schemas",
        description: "Lists all database schemas available in the PostgreSQL instance.",
        sampleArgs: {},
    },
    {
        id: "postgres_mcp.list_objects",
        name: "list_objects",
        description: "Lists database objects (tables, views, sequences, extensions) within a specified schema.",
        sampleArgs: { schema: "public" },
    },
    {
        id: "postgres_mcp.get_object_details",
        name: "get_object_details",
        description: "Provides information about a specific database object, e.g. a table's columns, constraints, and indexes.",
        sampleArgs: { schema: "public", name: "movies" },
    },
    {
        id: "postgres_mcp.execute_sql",
        name: "execute_sql",
        description: "Executes SQL statements on the database (restricted mode is read-only).",
        sampleArgs: { sql: "SELECT * FROM movies LIMIT 5" },
    },
    {
        id: "postgres_mcp.explain_query",
        name: "explain_query",
        description: "Gets an EXPLAIN plan for a SQL query, optionally with hypothetical indexes.",
        sampleArgs: { sql: "SELECT * FROM movies WHERE id = 1" },
    },
    {
        id: "postgres_mcp.get_top_queries",
        name: "get_top_queries",
        description: "Reports the slowest SQL queries based on pg_stat_statements data.",
        sampleArgs: { limit: 10, orderBy: "total_time" },
    },
    {
        id: "postgres_mcp.analyze_workload_indexes",
        name: "analyze_workload_indexes",
        description: "Analyzes workload to recommend optimal indexes.",
        sampleArgs: { timeBudgetSeconds: 30 },
    },
    {
        id: "postgres_mcp.analyze_query_indexes",
        name: "analyze_query_indexes",
        description: "Analyzes specific queries (up to 10) and recommends indexes.",
        sampleArgs: { queries: ["SELECT * FROM movies WHERE id = 1"] },
    },
    {
        id: "postgres_mcp.analyze_db_health",
        name: "analyze_db_health",
        description: "Performs comprehensive database health checks (connections, cache, vacuum, indexes, etc.).",
        sampleArgs: {},
    },
];

export const POSTGRES_MCP_TOOL_IDS = POSTGRES_MCP_TOOLS.map((t) => t.id);

export function getPostgresMcpToolByName(name: string): McpToolDef | undefined {
    return POSTGRES_MCP_TOOLS.find((t) => t.name === name);
}
