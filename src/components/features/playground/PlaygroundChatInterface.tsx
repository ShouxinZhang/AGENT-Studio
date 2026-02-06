import { useState, useEffect, useMemo, useRef } from "react";
import { Virtuoso } from "react-virtuoso";
import { cn } from "@/lib/utils";
import { useChatLogic, getMessageText } from "@/components/features/chat";
import { MessageBubble, ChatInput, EmptyState, LoadingIndicator, ErrorDisplay } from "@/components/features/chat";
import type { GameApi, GameId } from "./games/types";
import { extractLatestMcpToolRequest } from "./mcp/extractMcpRequest";
import { PlaygroundChatHeader, type SidebarView } from "./components/PlaygroundChatHeader";
import { PlaygroundHistoryList } from "./components/PlaygroundHistoryList";
import { PlaygroundToolsView } from "./components/PlaygroundToolsView";
import { useChatStore } from "@/lib/store/useChatStore";

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
    const [view, setView] = useState<SidebarView>("chat");
    const createConversation = useChatStore((s) => s.createConversation);
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
    } = useChatLogic({ toolScope: "playground", systemPromptAppend });

    const isStreaming = status === "streaming";
    const handledRef = useRef<Set<string>>(new Set());

    // Switch view back to chat when chat streaming/submission starts.
    useEffect(() => {
        if (messages.length > 0 && view !== "chat" && (status === "streaming" || status === "submitted")) {
            const timer = setTimeout(() => setView("chat"), 0);
            return () => clearTimeout(timer);
        }
    }, [messages.length, status, view]);

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

    const handleNewChat = () => {
        createConversation();
        setView("chat");
    };

    return (
        <div className="flex flex-col h-full relative bg-background overflow-hidden">
            <PlaygroundChatHeader
                currentView={view}
                onViewChange={setView}
                onNewChat={handleNewChat}
            />

            <div className="flex-1 min-h-0 relative flex flex-col">
                {view === "chat" && (
                    <>
                        <div className="flex-1 min-h-0">
                            {messages.length === 0 ? (
                                <div className="h-full overflow-y-auto p-4 flex flex-col items-center justify-center opacity-50 space-y-4">
                                    <EmptyState />
                                    <p className="text-xs max-w-[200px] text-center">
                                        Ask me to play the game or get the current state!
                                    </p>
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
                                        <div className={cn("px-4 py-2", index === 0 && "pt-6")}>
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

                        <div className="shrink-0">
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
                    </>
                )}

                {view === "history" && (
                    <div className="flex-1 flex flex-col min-h-0">
                        <PlaygroundHistoryList />
                    </div>
                )}

                {view === "tools" && (
                    <div className="flex-1 flex flex-col min-h-0">
                        <PlaygroundToolsView />
                    </div>
                )}
            </div>
        </div>
    );
}
