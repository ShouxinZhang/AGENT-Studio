import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { stepCountIs, streamText, tool, type CoreMessage, type UIMessage, type ToolSet } from 'ai';
import { z } from 'zod';
import { DEFAULT_MODEL_ID } from '@/lib/config/llm';
import type { FilePart, ImagePart } from '@ai-sdk/provider-utils';
import { POSTGRES_MCP_TOOLS } from '@/lib/mcp/postgresMcpCatalog';

const MCP_BACKEND_URL = process.env.MCP_BACKEND_URL || 'http://localhost:8090';

function toToolKey(toolId: string): string {
    // Providers typically require tool names without dots.
    return toolId.replace(/[^a-zA-Z0-9_-]+/g, '__');
}

async function mcpCall(toolId: string, args: Record<string, unknown>, abortSignal?: AbortSignal): Promise<unknown> {
    const res = await fetch(`${MCP_BACKEND_URL}/mcp/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ tool: toolId, args }),
        cache: 'no-store',
        signal: abortSignal,
    });

    const text = await res.text();
    let json: unknown = text;
    try {
        json = JSON.parse(text);
    } catch {
        // ignore
    }

    if (!res.ok) {
        throw new Error(`mcp_call_failed:${res.status}:${typeof json === 'string' ? json : JSON.stringify(json)}`);
    }

    return json;
}

function buildEnabledTools(enabledToolIds: unknown) {
    const ids = Array.isArray(enabledToolIds)
        ? enabledToolIds.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
        : [];

    const catalogById = new Map(POSTGRES_MCP_TOOLS.map((t) => [t.id, t] as const));

    const tools: ToolSet = {};
    for (const id of ids) {
        if (!id.startsWith('postgres_mcp.')) continue;

        const def = catalogById.get(id);
        const key = toToolKey(id);

        tools[key] = tool({
            description: def
                ? `MCP tool (${id}): ${def.description}`
                : `MCP tool (${id})`,
            // MCP tool schemas are not available here; accept a free-form JSON object.
            inputSchema: z.record(z.any()).describe('Arguments for the MCP tool as a JSON object.'),
            execute: async (input: unknown, { abortSignal }) => {
                if (process.env.CHAT_DEBUG_TOOLS === '1') {
                    console.log('[chat] tool call ->', id, input);
                }
                const args = (input && typeof input === 'object') ? (input as Record<string, unknown>) : {};
                return mcpCall(id, args, abortSignal);
            },
        });
    }

    return tools;
}

function trimByTurns(messages: UIMessage[], turns: unknown): UIMessage[] {
    if (typeof turns !== 'number' || !Number.isFinite(turns) || turns <= 0) return messages;
    // A turn ~= user + assistant; approximate by keeping last N*2 messages.
    const maxMessages = Math.max(1, Math.floor(turns) * 2);
    if (messages.length <= maxMessages) return messages;
    return messages.slice(-maxMessages);
}

type ReasoningPart = {
    type: 'reasoning';
    text: string;
    providerOptions?: Record<string, Record<string, unknown>>;
};

type TextPart = { type: 'text'; text: string };

type AssistantContentPart = TextPart | ReasoningPart;

type UserContentPart = TextPart | ImagePart | FilePart;

function splitDataUrl(dataUrl: string): { mediaType?: string; base64Content?: string } {
    const [header, base64Content] = dataUrl.split(',');
    if (!header || !base64Content) return {};
    const match = header.match(/^data:([^;]+);base64$/);
    return { mediaType: match?.[1], base64Content };
}

function toDataContentOrUrl(url: string, reqUrl: string): { data?: string; url?: URL } {
    if (url.startsWith('data:')) {
        const { base64Content } = splitDataUrl(url);
        if (base64Content) return { data: base64Content };
        return {};
    }

    try {
        if (url.startsWith('/')) {
            const origin = new URL(reqUrl).origin;
            return { url: new URL(url, origin) };
        }
        return { url: new URL(url) };
    } catch {
        return {};
    }
}

// Allow streaming responses up to 60 seconds for reasoning models
export const maxDuration = 60;

export async function POST(req: Request) {
    const { messages, model, temperature, topP, topK, reasoningEffort, system, openRouterApiKey, enabledToolIds, chatMemoryTurns } = await req.json();

    const apiKey = (typeof openRouterApiKey === 'string' && openRouterApiKey.trim())
        ? openRouterApiKey.trim()
        : (process.env.OPENROUTER_API_KEY ?? '');

    const openrouter = createOpenRouter({ apiKey });

    // Default to a sane model if none provided
    const modelId = model || DEFAULT_MODEL_ID;

    // Determine if reasoning should be enabled and configure settings
    const isGemini = modelId.toLowerCase().includes('gemini');
    const shouldEnableReasoning = (reasoningEffort && reasoningEffort !== 'none') || isGemini;
    const effectiveReasoningEffort = reasoningEffort && reasoningEffort !== 'none'
        ? reasoningEffort
        : (isGemini ? 'medium' : undefined);

    // Build model settings for reasoning
    // OpenRouter uses `reasoning` param with `effort` field
    const modelSettings: Record<string, unknown> = {};
    if (shouldEnableReasoning && effectiveReasoningEffort) {
        modelSettings.reasoning = { effort: effectiveReasoningEffort };
        // Legacy param that may be needed for some models
        modelSettings.includeReasoning = true;
    }

    // Convert UIMessages to core messages format for the model
    // For assistant messages, preserve reasoning parts to maintain thought context
    // This is crucial for Gemini 3.x models which require thought_signature in multi-turn conversations
    const uiMessages = trimByTurns(messages as UIMessage[], chatMemoryTurns);
    const coreMessages = uiMessages.map((msg): CoreMessage => {
        if (msg.role === 'user') {
            const contentParts: UserContentPart[] = [];

            for (const part of msg.parts || []) {
                if (part.type === 'text') {
                    contentParts.push({ type: 'text', text: part.text });
                    continue;
                }

                if (part.type === 'file') {
                    const filePart = part as { type: 'file'; url: string; mediaType: string; filename?: string };
                    const resolved = toDataContentOrUrl(filePart.url, req.url);

                    if (filePart.mediaType?.startsWith('image/')) {
                        if (resolved.data) {
                            contentParts.push({ type: 'image', image: resolved.data, mediaType: filePart.mediaType });
                        } else if (resolved.url) {
                            contentParts.push({ type: 'image', image: resolved.url, mediaType: filePart.mediaType });
                        }
                    } else {
                        if (resolved.data) {
                            contentParts.push({ type: 'file', data: resolved.data, mediaType: filePart.mediaType, filename: filePart.filename });
                        } else if (resolved.url) {
                            contentParts.push({ type: 'file', data: resolved.url, mediaType: filePart.mediaType, filename: filePart.filename });
                        }
                    }
                }
            }

            // Back-compat: if only text exists, keep string form.
            const hasOnlyTextParts = contentParts.length > 0 && contentParts.every(p => p.type === 'text');
            if (hasOnlyTextParts) {
                const textContent = contentParts
                    .filter((p): p is TextPart => p.type === 'text')
                    .map(p => p.text)
                    .join('');
                return { role: 'user', content: textContent };
            }

            if (contentParts.length === 0) {
                return { role: 'user', content: '' };
            }

            return { role: 'user', content: contentParts } as CoreMessage;
        }

        // Assistant messages: preserve complete parts structure (including reasoning)
        // This ensures thought_signature is passed back for Gemini 3.x models
        const contentParts: AssistantContentPart[] = [];

        for (const part of msg.parts || []) {
            if (part.type === 'text') {
                contentParts.push({ type: 'text', text: part.text });
            } else if (part.type === 'reasoning') {
                const providerOptions =
                    typeof (part as { providerMetadata?: unknown }).providerMetadata === 'object' &&
                    (part as { providerMetadata?: Record<string, Record<string, unknown>> }).providerMetadata
                        ? (part as { providerMetadata?: Record<string, Record<string, unknown>> }).providerMetadata
                        : undefined;
                contentParts.push({
                    type: 'reasoning',
                    text: part.text,
                    // Preserve provider-specific data (like thought_signature)
                    providerOptions,
                });
            }
        }

        // If only text parts exist or no parts, simplify to string format
        const hasOnlyTextParts = contentParts.every(p => p.type === 'text');
        if (hasOnlyTextParts) {
            const textContent = contentParts
                .filter(p => p.type === 'text')
                .map(p => p.text)
                .join('');
            return { role: 'assistant', content: textContent };
        }

        // If no content parts, return empty string
        if (contentParts.length === 0) {
            return { role: 'assistant', content: '' };
        }

        // Return with full content array (includes reasoning parts)
        return { role: 'assistant', content: contentParts } as CoreMessage;
    });

    const enabledTools = buildEnabledTools(enabledToolIds);
    const hasTools = Object.keys(enabledTools).length > 0;

    const requestBody: Parameters<typeof streamText>[0] & {
        topK?: number;
        tools?: ToolSet;
        stopWhen?: ReturnType<typeof stepCountIs>;
    } = {
        // Pass model settings (including reasoning config) to the model
        model: openrouter(modelId, modelSettings),
        messages: coreMessages,
        system,
        temperature: temperature ?? 1,
        topP: topP ?? 1,
    };

    if (typeof topK === 'number') {
        requestBody.topK = topK;
    }

    if (hasTools) {
        requestBody.tools = enabledTools;
        requestBody.stopWhen = stepCountIs(5);
    }

    const result = streamText(requestBody);

    return result.toUIMessageStreamResponse({
        sendReasoning: true,
    });
}
