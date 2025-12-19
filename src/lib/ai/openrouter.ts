import { createOpenAI } from "@ai-sdk/openai";

const baseURL = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

const headers: Record<string, string> = {};

if (process.env.OPENROUTER_HTTP_REFERER) {
  headers["HTTP-Referer"] = process.env.OPENROUTER_HTTP_REFERER;
}

if (process.env.OPENROUTER_APP_NAME) {
  headers["X-Title"] = process.env.OPENROUTER_APP_NAME;
}

export const openRouter = createOpenAI({
  baseURL,
  apiKey: process.env.OPENROUTER_API_KEY,
  headers,
});

export const defaultOpenRouterModel = "anthropic/claude-3.5-sonnet";
