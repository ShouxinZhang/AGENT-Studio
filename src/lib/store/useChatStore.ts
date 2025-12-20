import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UIMessage } from "ai";

export type Conversation = {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    messages: UIMessage[];
};

type ChatStore = {
    conversations: Conversation[];
    activeConversationId: string;
    createConversation: () => string;
    setActiveConversation: (id: string) => void;
    updateConversationMessages: (id: string, messages: UIMessage[]) => void;
    deleteConversation: (id: string) => void;
    renameConversation: (id: string, title: string) => void;
};

const DEFAULT_TITLE = "New Chat";
const TITLE_MAX_LENGTH = 48;

const createId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getMessageText = (message: UIMessage) =>
    message.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("");

const deriveTitle = (messages: UIMessage[]) => {
    const firstUser = messages.find((message) => message.role === "user");
    if (!firstUser) {
        return DEFAULT_TITLE;
    }

    const text = getMessageText(firstUser).trim();
    if (!text) {
        return DEFAULT_TITLE;
    }

    if (text.length <= TITLE_MAX_LENGTH) {
        return text;
    }

    return `${text.slice(0, TITLE_MAX_LENGTH - 3)}...`;
};

const createConversation = (id: string): Conversation => {
    const now = Date.now();

    return {
        id,
        title: DEFAULT_TITLE,
        createdAt: now,
        updatedAt: now,
        messages: [],
    };
};

const initialConversationId = createId();

export const useChatStore = create<ChatStore>()(
    persist(
        (set, get) => ({
            conversations: [createConversation(initialConversationId)],
            activeConversationId: initialConversationId,
            createConversation: () => {
                const id = createId();
                const conversation = createConversation(id);

                set((state) => ({
                    conversations: [conversation, ...state.conversations],
                    activeConversationId: id,
                }));

                return id;
            },
            setActiveConversation: (id) => {
                set({ activeConversationId: id });
            },
            updateConversationMessages: (id, messages) => {
                const nextTitle = deriveTitle(messages);

                set((state) => ({
                    conversations: state.conversations.map((conversation) => {
                        if (conversation.id !== id) {
                            return conversation;
                        }

                        return {
                            ...conversation,
                            messages,
                            updatedAt: Date.now(),
                            title: conversation.title === DEFAULT_TITLE ? nextTitle : conversation.title,
                        };
                    }),
                }));
            },
            deleteConversation: (id) => {
                const { conversations, activeConversationId } = get();
                const filteredConversations = conversations.filter((c) => c.id !== id);

                // If we deleted all conversations, create a new one
                if (filteredConversations.length === 0) {
                    const newId = createId();
                    set({
                        conversations: [createConversation(newId)],
                        activeConversationId: newId,
                    });
                    return;
                }

                // If we deleted the active conversation, switch to the first available one
                if (activeConversationId === id) {
                    set({
                        conversations: filteredConversations,
                        activeConversationId: filteredConversations[0].id,
                    });
                } else {
                    set({ conversations: filteredConversations });
                }
            },
            renameConversation: (id, title) => {
                set((state) => ({
                    conversations: state.conversations.map((c) =>
                        c.id === id ? { ...c, title, updatedAt: Date.now() } : c
                    ),
                }));
            },
        }),
        {
            name: "agent-studio-chats",
        }
    )
);
