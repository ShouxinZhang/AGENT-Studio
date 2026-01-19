import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_MODEL_ID } from '@/lib/config/llm';

export type ReasoningEffort = 'xhigh' | 'high' | 'medium' | 'low' | 'minimal' | 'none';

export type ToolScope = "chat" | "sql";

type EnabledToolIdsByScope = Record<ToolScope, string[]>;

export interface SystemInstruction {
    id: string;
    title: string;
    content: string;
}

export interface SettingsState {
    model: string;
    temperature: number;
    topP: number;
    topK: number;
    reasoningEffort: ReasoningEffort;
    /** Max chat memory to send to LLM (0 = unlimited). One turn ~= user+assistant. */
    chatMemoryTurns: number;
    openRouterApiKey: string;
    systemInstructions: SystemInstruction[];
    activeSystemInstructionId: string | null;
    enabledToolIdsByScope: EnabledToolIdsByScope;
    setModel: (model: string) => void;
    setTemperature: (temp: number) => void;
    setTopP: (topP: number) => void;
    setTopK: (topK: number) => void;
    setReasoningEffort: (effort: ReasoningEffort) => void;
    setChatMemoryTurns: (turns: number) => void;
    setOpenRouterApiKey: (apiKey: string) => void;
    addSystemInstruction: (instruction: Omit<SystemInstruction, 'id'>) => string;
    updateSystemInstruction: (id: string, updates: Partial<Omit<SystemInstruction, 'id'>>) => void;
    deleteSystemInstruction: (id: string) => void;
    setSystemInstructions: (systemInstructions: SystemInstruction[], activeSystemInstructionId: string | null) => void;
    setActiveSystemInstructionId: (id: string | null) => void;
    setEnabledToolIdsForScope: (scope: ToolScope, toolIds: string[]) => void;
    toggleToolIdForScope: (scope: ToolScope, toolId: string) => void;
}

const SETTINGS_STORE_VERSION = 1;

function generateId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).slice(2);
}

const DEFAULT_INSTRUCTIONS: SystemInstruction[] = [
    { id: 'default-1', title: 'General Assistant', content: 'You are a helpful, creative, clever, and very friendly assistant.' },
    { id: 'default-2', title: 'Code Expert', content: 'You are an expert software engineer. Provide concise, efficient, and well-documented code solutions.' },
];

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            model: DEFAULT_MODEL_ID,
            temperature: 1.0,
            topP: 0.95,
            topK: 40,
            reasoningEffort: 'medium',
            chatMemoryTurns: 50,
            openRouterApiKey: '',
            systemInstructions: DEFAULT_INSTRUCTIONS,
            activeSystemInstructionId: 'default-1',
            enabledToolIdsByScope: { chat: [], sql: [] },
            setModel: (model) => set({ model }),
            setTemperature: (temperature) => set({ temperature }),
            setTopP: (topP) => set({ topP }),
            setTopK: (topK) => set({ topK }),
            setReasoningEffort: (reasoningEffort) => set({ reasoningEffort }),
            setChatMemoryTurns: (turns) => set({ chatMemoryTurns: turns }),
            setOpenRouterApiKey: (openRouterApiKey) => set({ openRouterApiKey }),
            addSystemInstruction: (instruction) => {
                const id = generateId();
                set((state) => ({
                    systemInstructions: [...state.systemInstructions, { ...instruction, id }],
                    activeSystemInstructionId: id,
                }));
                return id;
            },
            updateSystemInstruction: (id, updates) => {
                set((state) => ({
                    systemInstructions: state.systemInstructions.map((si) =>
                        si.id === id ? { ...si, ...updates } : si
                    ),
                }));
            },
            deleteSystemInstruction: (id) => {
                set((state) => {
                    const nextInstructions = state.systemInstructions.filter((si) => si.id !== id);
                    let nextActiveId = state.activeSystemInstructionId;
                    if (nextActiveId === id) {
                        nextActiveId = nextInstructions.length > 0 ? nextInstructions[0].id : null;
                    }
                    return {
                        systemInstructions: nextInstructions,
                        activeSystemInstructionId: nextActiveId,
                    };
                });
            },
            setSystemInstructions: (systemInstructions, activeSystemInstructionId) => {
                set(() => {
                    const ids = new Set(systemInstructions.map((si) => si.id));
                    const nextActiveId = activeSystemInstructionId && ids.has(activeSystemInstructionId)
                        ? activeSystemInstructionId
                        : (systemInstructions.length > 0 ? systemInstructions[0].id : null);
                    return {
                        systemInstructions,
                        activeSystemInstructionId: nextActiveId,
                    };
                });
            },
            setActiveSystemInstructionId: (id) => set({ activeSystemInstructionId: id }),
            setEnabledToolIdsForScope: (scope, toolIds) => {
                set((state) => ({
                    enabledToolIdsByScope: {
                        ...state.enabledToolIdsByScope,
                        [scope]: Array.isArray(toolIds) ? toolIds : [],
                    },
                }));
            },
            toggleToolIdForScope: (scope, toolId) => {
                const id = toolId.trim();
                if (!id) return;
                set((state) => {
                    const current = state.enabledToolIdsByScope?.[scope] ?? [];
                    const next = new Set(current);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return {
                        enabledToolIdsByScope: {
                            ...state.enabledToolIdsByScope,
                            [scope]: Array.from(next),
                        },
                    };
                });
            },
        }),
        {
            name: 'agent-studio-settings',
            version: SETTINGS_STORE_VERSION,
            migrate: (persistedState: unknown) => {
                const persistedObj = (persistedState && typeof persistedState === 'object')
                    ? (persistedState as Record<string, unknown>)
                    : null;
                const raw = persistedObj && typeof persistedObj.state === 'object'
                    ? persistedObj.state
                    : persistedState;

                const next = (raw && typeof raw === 'object')
                    ? (raw as Record<string, unknown>)
                    : {};

                const enabledToolIdsByScope = (() => {
                    const v = next.enabledToolIdsByScope;
                    const obj = (v && typeof v === 'object') ? (v as Record<string, unknown>) : {};
                    const chat = Array.isArray(obj.chat) ? obj.chat.filter((x) => typeof x === 'string') : [];
                    const sql = Array.isArray(obj.sql) ? obj.sql.filter((x) => typeof x === 'string') : [];
                    return { chat, sql } as EnabledToolIdsByScope;
                })();

                return {
                    model: typeof next.model === 'string' ? (next.model as string) : DEFAULT_MODEL_ID,
                    temperature: typeof next.temperature === 'number' ? (next.temperature as number) : 1.0,
                    topP: typeof next.topP === 'number' ? (next.topP as number) : 0.95,
                    topK: typeof next.topK === 'number' ? (next.topK as number) : 40,
                    reasoningEffort: (typeof next.reasoningEffort === 'string' ? (next.reasoningEffort as ReasoningEffort) : 'medium'),
                    chatMemoryTurns: typeof next.chatMemoryTurns === 'number' ? (next.chatMemoryTurns as number) : 50,
                    openRouterApiKey: typeof next.openRouterApiKey === 'string' ? (next.openRouterApiKey as string) : '',
                    systemInstructions: Array.isArray(next.systemInstructions) && next.systemInstructions.length > 0
                        ? (next.systemInstructions as SystemInstruction[])
                        : DEFAULT_INSTRUCTIONS,
                    activeSystemInstructionId: typeof next.activeSystemInstructionId === 'string'
                        ? (next.activeSystemInstructionId as string)
                        : 'default-1',
                    enabledToolIdsByScope,
                } as unknown as SettingsState;
            },
        }
    )
);
