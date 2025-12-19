"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { readStudioState, writeStudioState } from "@/lib/storage/studio-storage";
import { createNewConversation, defaultSettings, seedConversations } from "./defaults";
import type { ChatMessage, ChatSettings, Conversation, StudioState } from "./types";
import { deriveTitle, sortConversations } from "../utils/conversation";

type StudioAction =
  | { type: "hydrate"; state: StudioState }
  | { type: "createConversation"; conversation: Conversation }
  | { type: "setActiveConversation"; id: string }
  | { type: "deleteConversation"; id: string }
  | { type: "updateConversationMessages"; id: string; messages: ChatMessage[] }
  | { type: "updateSettings"; settings: Partial<ChatSettings> };

type StudioContextValue = {
  state: StudioState;
  actions: {
    createConversation: () => string;
    setActiveConversation: (id: string) => void;
    deleteConversation: (id: string) => void;
    updateConversationMessages: (id: string, messages: ChatMessage[]) => void;
    updateSettings: (settings: Partial<ChatSettings>) => void;
  };
};

const initialState: StudioState = {
  conversations: seedConversations,
  activeConversationId: seedConversations[0]?.id ?? null,
  settings: defaultSettings,
};

function studioReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case "hydrate":
      return {
        ...state,
        ...action.state,
        settings: {
          ...defaultSettings,
          ...action.state.settings,
        },
      };
    case "createConversation": {
      const conversations = sortConversations([
        action.conversation,
        ...state.conversations,
      ]);
      return {
        ...state,
        conversations,
        activeConversationId: action.conversation.id,
      };
    }
    case "setActiveConversation":
      return {
        ...state,
        activeConversationId: action.id,
      };
    case "deleteConversation": {
      const conversations = state.conversations.filter(
        (conversation) => conversation.id !== action.id,
      );
      const nextActiveId =
        state.activeConversationId === action.id
          ? conversations[0]?.id ?? null
          : state.activeConversationId;
      return {
        ...state,
        conversations,
        activeConversationId: nextActiveId,
      };
    }
    case "updateConversationMessages": {
      const conversations = state.conversations.map((conversation) => {
        if (conversation.id !== action.id) {
          return conversation;
        }
        const title =
          conversation.title === "新对话" ? deriveTitle(action.messages) : conversation.title;
        return {
          ...conversation,
          messages: action.messages,
          title,
          updatedAt: new Date().toISOString(),
        };
      });
      return {
        ...state,
        conversations: sortConversations(conversations),
      };
    }
    case "updateSettings":
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.settings,
        },
      };
    default:
      return state;
  }
}

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(studioReducer, initialState);
  const hasHydrated = useRef(false);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = readStudioState();
    if (stored) {
      dispatch({ type: "hydrate", state: stored });
    }
    hasHydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hasHydrated.current) {
      return;
    }
    if (persistTimer.current) {
      clearTimeout(persistTimer.current);
    }
    persistTimer.current = setTimeout(() => {
      writeStudioState(state);
    }, 300);
    return () => {
      if (persistTimer.current) {
        clearTimeout(persistTimer.current);
      }
    };
  }, [state]);

  const actions = useMemo(
    () => ({
      createConversation: () => {
        const conversation = createNewConversation();
        dispatch({ type: "createConversation", conversation });
        return conversation.id;
      },
      setActiveConversation: (id: string) => {
        dispatch({ type: "setActiveConversation", id });
      },
      deleteConversation: (id: string) => {
        dispatch({ type: "deleteConversation", id });
      },
      updateConversationMessages: (id: string, messages: ChatMessage[]) => {
        dispatch({ type: "updateConversationMessages", id, messages });
      },
      updateSettings: (settings: Partial<ChatSettings>) => {
        dispatch({ type: "updateSettings", settings });
      },
    }),
    [],
  );

  return <StudioContext.Provider value={{ state, actions }}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error("useStudio must be used within StudioProvider.");
  }
  return context;
}
