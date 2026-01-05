import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, type UIMessage, type CoreMessage } from 'ai';
import { DEFAULT_MODEL_ID } from '@/lib/config/llm';

type ReasoningPart = {
    type: 'reasoning';
    text: string;
    providerOptions?: Record<string, Record<string, unknown>>;
};

type TextPart = { type: 'text'; text: string };

type AssistantContentPart = TextPart | ReasoningPart;

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
            // User messages: extract plain text only
            const textContent = msg.parts
                ?.filter((part): part is { type: 'text'; text: string } => part.type === 'text')
                .map((part) => part.text)
                .join('') || '';
            return { role: 'user', content: textContent };
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
