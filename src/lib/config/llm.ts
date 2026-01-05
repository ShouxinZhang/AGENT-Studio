import type { ReasoningEffort } from "@/lib/store/useSettingsStore";

export const DEFAULT_MODEL_ID = "google/gemini-3-flash-preview";

export const AVAILABLE_MODELS = [
    { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash Preview" },
    { id: "google/gemini-3-pro-preview", name: "Gemini 3 Pro Preview" },
    { id: "openai/gpt-5.2", name: "GPT-5.2" },
    { id: "x-ai/grok-4.1-fast", name: "Grok 4.1 Fast" },
    { id: "anthropic/claude-opus-4.5", name: "Claude Opus 4.5" },
    { id: "anthropic/claude-sonnet-4.5", name: "Claude Sonnet 4.5" },
] as const;

export const REASONING_EFFORT_OPTIONS: { value: ReasoningEffort; label: string }[] = [
    { value: "xhigh", label: "Extra High" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
    { value: "minimal", label: "Minimal" },
    { value: "none", label: "None" },
];
