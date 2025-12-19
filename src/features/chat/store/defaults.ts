import { createId } from "../utils/id";
import type { ChatSettings, Conversation } from "./types";

export const defaultSettings: ChatSettings = {
  model: "anthropic/claude-3.5-sonnet",
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.9,
  presencePenalty: 0,
  frequencyPenalty: 0,
  systemPrompt:
    "你是一个专业的 AI 助理，回答要结构清晰、重点明确，并主动提出可执行的下一步。",
  stream: true,
};

export const seedConversations: Conversation[] = [
  {
    id: "seed-setup",
    title: "欢迎来到 Agent Studio",
    updatedAt: new Date().toISOString(),
    messages: [
      {
        id: "seed-setup-user",
        role: "user",
        content: "帮我规划一个能落地的智能体搭建方案。",
        createdAt: new Date().toISOString(),
      },
      {
        id: "seed-setup-assistant",
        role: "assistant",
        content:
          "当然可以。我会先拆解目标、关键模块和验收标准，然后给出分阶段实现计划，确保每一步都可验证。",
        createdAt: new Date().toISOString(),
      },
    ],
  },
];

export function createNewConversation(): Conversation {
  const now = new Date().toISOString();
  return {
    id: createId("conversation"),
    title: "新对话",
    updatedAt: now,
    messages: [],
  };
}
