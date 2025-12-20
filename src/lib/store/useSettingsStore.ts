import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ReasoningEffort = 'xhigh' | 'high' | 'medium' | 'low' | 'minimal' | 'none';

export interface SettingsState {
    model: string;
    temperature: number;
    topP: number;
    topK: number;
    reasoningEffort: ReasoningEffort;
    systemInstruction: string;
    setModel: (model: string) => void;
    setTemperature: (temp: number) => void;
    setTopP: (topP: number) => void;
    setTopK: (topK: number) => void;
    setReasoningEffort: (effort: ReasoningEffort) => void;
    setSystemInstruction: (instruction: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            model: 'google/gemini-3-flash-preview',
            temperature: 1.0,
            topP: 0.95,
            topK: 40,
            reasoningEffort: 'medium',
            systemInstruction: '',
            setModel: (model) => set({ model }),
            setTemperature: (temperature) => set({ temperature }),
            setTopP: (topP) => set({ topP }),
            setTopK: (topK) => set({ topK }),
            setReasoningEffort: (reasoningEffort) => set({ reasoningEffort }),
            setSystemInstruction: (systemInstruction) => set({ systemInstruction }),
        }),
        {
            name: 'agent-studio-settings',
        }
    )
);
