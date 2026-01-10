// Types for English Learning Module

export interface WordEntry {
    id: string;
    word: string;
    pronunciation: string;
    meaning: string;
    semantics: string; // concise English sentence
    tags: string[];
    images: string[];
    noteContent: string; // Markdown
}

export interface Point {
    x: number;
    y: number;
}

export interface Stroke {
    points: Point[];
    color: string;
    width: number;
}

export type GraffitiTool = 'pen' | 'eraser';

export interface GraffitiState {
    showGraffiti: boolean;
    isDrawingMode: boolean;
    activeTool: GraffitiTool;
    activeColor: string;
    brushSize: number;
}

export interface GraffitiActions {
    setShowGraffiti: (show: boolean) => void;
    setIsDrawingMode: (mode: boolean) => void;
    setActiveTool: (tool: GraffitiTool) => void;
    setActiveColor: (color: string) => void;
    setBrushSize: (size: number) => void;
    handleStrokeChange: (strokes: Stroke[]) => void;
    handleUndo: () => void;
    handleClear: () => void;
}
