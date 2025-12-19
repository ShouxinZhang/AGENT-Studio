import { streamText, type CoreMessage } from "ai";
import { defaultOpenRouterModel, openRouter } from "@/lib/ai/openrouter";
import type { ChatSettings } from "@/features/chat/store/types";

type ChatRequest = {
  messages: Array<{ role: CoreMessage["role"]; content: string }>;
  settings?: Partial<ChatSettings>;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const parseNumber = (value: unknown, fallback: number, min: number, max: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }
  return clamp(value, min, max);
};

export async function POST(req: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return Response.json(
      { error: "Missing OPENROUTER_API_KEY in environment." },
      { status: 500 },
    );
  }

  const { messages = [], settings = {} }: ChatRequest = await req.json();
  const systemPrompt = settings.systemPrompt?.trim();

  const coreMessages: CoreMessage[] = [
    ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
    ...messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ];

  const result = await streamText({
    model: openRouter(settings.model ?? defaultOpenRouterModel),
    messages: coreMessages,
    temperature: parseNumber(settings.temperature, 0.7, 0, 2),
    maxTokens: parseNumber(settings.maxTokens, 2048, 128, 8192),
    topP: parseNumber(settings.topP, 0.9, 0, 1),
    presencePenalty: parseNumber(settings.presencePenalty, 0, -2, 2),
    frequencyPenalty: parseNumber(settings.frequencyPenalty, 0, -2, 2),
  });

  return result.toDataStreamResponse();
}
