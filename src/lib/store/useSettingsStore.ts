import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
    systemInstructions: SystemInstruction[];
    activeSystemInstructionId: string | null;
    setModel: (model: string) => void;
    setTemperature: (temp: number) => void;
    setTopP: (topP: number) => void;
    setTopK: (topK: number) => void;
    setReasoningEffort: (effort: ReasoningEffort) => void;
    addSystemInstruction: (instruction: Omit<SystemInstruction, 'id'>) => string;
    updateSystemInstruction: (id: string, updates: Partial<Omit<SystemInstruction, 'id'>>) => void;
    deleteSystemInstruction: (id: string) => void;
    setActiveSystemInstructionId: (id: string | null) => void;
}

const DEFAULT_INSTRUCTIONS: SystemInstruction[] = [
    { id: 'default-1', title: 'General Assistant', content: 'You are a helpful, creative, clever, and very friendly assistant.' },
    { id: 'default-2', title: 'Code Expert', content: 'You are an expert software engineer. Provide concise, efficient, and well-documented code solutions.' },
];

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            model: 'google/gemini-3-flash-preview',
            temperature: 1.0,
            topP: 0.95,
            topK: 40,
            reasoningEffort: 'medium',
            systemInstructions: DEFAULT_INSTRUCTIONS,
            activeSystemInstructionId: 'default-1',
            setModel: (model) => set({ model }),
            setTemperature: (temperature) => set({ temperature }),
            setTopP: (topP) => set({ topP }),
            setTopK: (topK) => set({ topK }),
            setReasoningEffort: (reasoningEffort) => set({ reasoningEffort }),
            addSystemInstruction: (instruction) => {
                const id = Math.random().toString(36).substring(7);
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
            setActiveSystemInstructionId: (id) => set({ activeSystemInstructionId: id }),
        }),
        {
            name: 'agent-studio-settings',
        }
    )
);
