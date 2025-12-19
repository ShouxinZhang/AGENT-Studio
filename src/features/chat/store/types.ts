export type MessageRole = "assistant" | "user" | "system";

export type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
};

export type ChatSettings = {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  presencePenalty: number;
  frequencyPenalty: number;
  systemPrompt: string;
  stream: boolean;
};

export type StudioState = {
  conversations: Conversation[];
  activeConversationId: string | null;
  settings: ChatSettings;
};
