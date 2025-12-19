import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Create OpenRouter client
const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY ?? '',
});

// Allow streaming responses up to 60 seconds for reasoning models
export const maxDuration = 60;

export async function POST(req: Request) {
    const { messages, model, temperature, topP, reasoningEffort, system } = await req.json();

    // Default to a sane model if none provided
    const modelId = model || 'google/gemini-3-flash-preview';

    // Build the request body with reasoning support
    const requestBody: any = {
        model: openrouter(modelId),
        messages,
        system,
        temperature: temperature ?? 0.7,
        topP: topP ?? 1,
    };

    // Add reasoning configuration if not 'none'
    // OpenRouter uses 'reasoning' parameter with 'effort' field
    if (reasoningEffort && reasoningEffort !== 'none') {
        requestBody.providerOptions = {
            openrouter: {
                reasoning: {
                    effort: reasoningEffort,
                },
            },
        };
    }

    const result = await streamText(requestBody);

    return result.toTextStreamResponse();
}
