import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, type UIMessage, type CoreMessage } from 'ai';
import { DEFAULT_MODEL_ID } from '@/lib/config/llm';
import type { FilePart, ImagePart } from '@ai-sdk/provider-utils';

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
    const { messages, model, temperature, topP, topK, reasoningEffort, system, openRouterApiKey } = await req.json();

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
    const coreMessages = (messages as UIMessage[]).map((msg): CoreMessage => {
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

    const requestBody: Parameters<typeof streamText>[0] & { topK?: number } = {
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

    const result = streamText(requestBody);

    return result.toUIMessageStreamResponse({
        sendReasoning: true,
    });
}
