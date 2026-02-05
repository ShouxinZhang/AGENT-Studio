export type McpToolRequest = {
    tool: string;
    args?: Record<string, unknown>;
};

export type ExtractedMcpToolRequest = {
    request: McpToolRequest;
    raw: string;
};
