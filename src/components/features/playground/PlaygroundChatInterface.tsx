"use client";

import { useEffect, useMemo, useRef } from "react";
import { Virtuoso } from "react-virtuoso";
import { cn } from "@/lib/utils";
import { useChatLogic, getMessageText } from "@/components/features/chat";
import { MessageBubble, ChatInput, EmptyState, LoadingIndicator, ErrorDisplay } from "@/components/features/chat";
import type { GameApi, GameId } from "./games/types";
import { extractLatestMcpToolRequest } from "./mcp/extractMcpRequest";

type Props = {
    gameId: GameId;
    apiRef: React.MutableRefObject<GameApi | null>;
};

function buildPlaygroundSystemPrompt(gameId: GameId) {
    return [
        `You are an agent playing the game ${gameId}.`,
        "All game state and actions are available via local MCP-style tools.",
        "When you need game data or want to act, emit EXACTLY ONE tool request as a fenced code block:",
        "```mcp\n{\"tool\":\"game.get_state\",\"args\":{}}\n```",
        "Available tools:",
        "- game.get_state  (args: {}) -> returns current game state JSON",
        "- game.get_actions (args: {}) -> returns allowed actions",
        "- game.step (args: {action: string}) -> applies one step and returns next state",
        "- game.reset (args: {}) -> resets game and returns state",
        "After emitting a tool request, WAIT for the tool result before continuing.",
        "Tool results will be sent back as a user message starting with [MCP_RESULT].",
    ].join("\n");
}

async function callGameTool(req: { tool: string; args?: Record<string, unknown> }, api: GameApi) {
    const tool = req.tool;
    const args = req.args ?? {};
    if (tool === "game.get_state") return api.getState();
    if (tool === "game.get_actions") return api.getActions();
    if (tool === "game.reset") {
        api.reset();
        return api.getState();
    }
    if (tool === "game.step") {
        const action = typeof args.action === "string" ? args.action : "none";
        api.step(action);
        return api.getState();
    }
    throw new Error(`unknown_tool:${tool}`);
}

export function PlaygroundChatInterface({ gameId, apiRef }: Props) {
    const systemPromptAppend = useMemo(() => buildPlaygroundSystemPrompt(gameId), [gameId]);

    const {
        input,
        messages,
        status,
        isLoading,
        error,
        handleSubmit,
        onInputKeyDown,
        handleInputChange,
        attachments,
        isUploadingAttachments,
        addFiles,
        removeAttachment,
        regenerate,
        stop,
        sendMessage,
    } = useChatLogic({ toolScope: "chat", systemPromptAppend });

    const isStreaming = status === "streaming";
    const handledRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (isStreaming) return;
        if (isLoading) return;
        if (messages.length === 0) return;

        const last = messages[messages.length - 1];
        if (!last || last.role !== "assistant") return;

        const text = getMessageText(last);
        if (!text) return;
        const extracted = extractLatestMcpToolRequest(text);
        if (!extracted) return;

        const key = `${last.id}:${extracted.raw}`;
        if (handledRef.current.has(key)) return;
        handledRef.current.add(key);

        const api = apiRef.current;
        if (!api) {
            void sendMessage({ text: `[MCP_RESULT] {\"ok\":false,\"error\":\"game_api_not_ready\"}` });
            return;
        }

        void (async () => {
            try {
                const result = await callGameTool(extracted.request, api);
                const payload = {
                    ok: true,
                    tool: extracted.request.tool,
                    game: api.gameId,
                    result,
                };
                await sendMessage({
                    text: `[MCP_RESULT]\n\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\``
                });
            } catch (e) {
                const msg = e instanceof Error ? e.message : "tool_failed";
                await sendMessage({
                    text: `[MCP_RESULT]\n\n\`\`\`json\n${JSON.stringify({ ok: false, tool: extracted.request.tool, error: msg }, null, 2)}\n\`\`\``
                });
            }
        })();
    }, [apiRef, isLoading, isStreaming, messages, sendMessage]);

    return (
        <div className="flex flex-col h-full relative bg-background">
            <div className="flex-1 min-h-0">
                {messages.length === 0 ? (
                    <div className="h-full overflow-y-auto p-4">
                        <EmptyState />
                    </div>
                ) : (
                    <Virtuoso
                        data={messages}
                        initialTopMostItemIndex={messages.length - 1}
                        followOutput={(isAtBottom) => {
                            if (isStreaming) return "smooth";
                            return isAtBottom ? "smooth" : false;
                        }}
                        className="h-full"
                        itemContent={(index, m) => (
                            <div className={cn("p-4", index === 0 && "pt-6")}>
                                <MessageBubble
                                    message={m}
                                    isLastMessage={index === messages.length - 1}
                                    isStreaming={isStreaming}
                                    isLoading={isLoading}
                                    onSaveEdit={async () => { /* editing not used here */ }}
                                    onRegenerate={regenerate}
                                />
                            </div>
                        )}
                        components={{
                            Footer: () => (
                                <div className="p-4 pt-0 space-y-4">
                                    {isLoading && <LoadingIndicator />}
                                    {error && <ErrorDisplay error={error} onRetry={regenerate} />}
                                    <div className="h-4" />
                                </div>
                            ),
                        }}
                    />
                )}
            </div>

            <ChatInput
                input={input}
                isLoading={isLoading}
                onInputChange={handleInputChange}
                onKeyDown={onInputKeyDown}
                onSubmit={handleSubmit}
                onStop={stop}
                attachments={attachments}
                isUploadingAttachments={isUploadingAttachments}
                onAddFiles={addFiles}
                onRemoveAttachment={removeAttachment}
            />
        </div>
    );
}
