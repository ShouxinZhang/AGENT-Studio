import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_MODEL_ID } from '@/lib/config/llm';

export type ReasoningEffort = 'xhigh' | 'high' | 'medium' | 'low' | 'minimal' | 'none';

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
    openRouterApiKey: string;
    systemInstructions: SystemInstruction[];
    activeSystemInstructionId: string | null;
    setModel: (model: string) => void;
    setTemperature: (temp: number) => void;
    setTopP: (topP: number) => void;
    setTopK: (topK: number) => void;
    setReasoningEffort: (effort: ReasoningEffort) => void;
    setOpenRouterApiKey: (apiKey: string) => void;
    addSystemInstruction: (instruction: Omit<SystemInstruction, 'id'>) => string;
    updateSystemInstruction: (id: string, updates: Partial<Omit<SystemInstruction, 'id'>>) => void;
    deleteSystemInstruction: (id: string) => void;
    setSystemInstructions: (systemInstructions: SystemInstruction[], activeSystemInstructionId: string | null) => void;
    setActiveSystemInstructionId: (id: string | null) => void;
}

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
            openRouterApiKey: '',
            systemInstructions: DEFAULT_INSTRUCTIONS,
            activeSystemInstructionId: 'default-1',
            setModel: (model) => set({ model }),
            setTemperature: (temperature) => set({ temperature }),
            setTopP: (topP) => set({ topP }),
            setTopK: (topK) => set({ topK }),
            setReasoningEffort: (reasoningEffort) => set({ reasoningEffort }),
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
        }),
        {
            name: 'agent-studio-settings',
        }
    )
);
