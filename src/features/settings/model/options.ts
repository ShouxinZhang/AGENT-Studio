export type ModelOption = {
  id: string;
  label: string;
  description: string;
};

export const modelOptions: ModelOption[] = [
  {
    id: "anthropic/claude-3.5-sonnet",
    label: "Claude 3.5 Sonnet",
    description: "高质量推理与写作能力，适合复杂任务。",
  },
  {
    id: "openai/gpt-4o-mini",
    label: "GPT-4o mini",
    description: "响应快速，成本较低，适合迭代。",
  },
  {
    id: "google/gemini-1.5-pro",
    label: "Gemini 1.5 Pro",
    description: "多模态能力强，适合广泛场景。",
  },
  {
    id: "meta-llama/llama-3.1-70b-instruct",
    label: "Llama 3.1 70B",
    description: "开源旗舰模型，适合定制化场景。",
  },
];
