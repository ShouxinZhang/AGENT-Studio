import { useState, useMemo, useCallback, useEffect } from 'react';
import { WordEntry, Stroke, GraffitiTool } from '../types';
import { MOCK_DB, GRAFFITI_COLORS } from '../data/mockData';
import { fetchEnglishNote, upsertEnglishNote } from '../api/notes';

// Stable empty array to prevent infinite loops
const EMPTY_STROKES: Stroke[] = [];

const WORDS_STORAGE_KEY = 'agent_studio_english_words_v1';

export interface UseEnglishLearningReturn {
    // Selection state
    selectedId: string | null;
    setSelectedId: (id: string | null) => void;
    
    // Search state
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    
    // Derived data
    filteredWords: WordEntry[];
    activeWord: WordEntry | undefined;

    // Words
    addWord: (input: { word: string; meaning: string; pronunciation?: string }) => void;

    // Note editing
    noteDraft: string;
    setNoteDraft: (content: string) => void;
    isEditingNote: boolean;
    setIsEditingNote: (editing: boolean) => void;
    isLoadingNote: boolean;
    isSavingNote: boolean;
    noteError: string | null;
    lastSavedAt: string | null;
    saveNote: () => Promise<void>;
    
    // Graffiti display state
    showGraffiti: boolean;
    setShowGraffiti: (show: boolean) => void;
    isDrawingMode: boolean;
    setIsDrawingMode: (mode: boolean) => void;
    
    // Graffiti tool state
    activeTool: GraffitiTool;
    setActiveTool: (tool: GraffitiTool) => void;
    activeColor: string;
    setActiveColor: (color: string) => void;
    brushSize: number;
    setBrushSize: (size: number) => void;
    
    // Graffiti data & actions
    currentStrokes: Stroke[];
    handleStrokeChange: (strokes: Stroke[]) => void;
    handleUndo: () => void;
    handleClear: () => void;
    
    // Constants
    graffitiColors: string[];
}

export function useEnglishLearning(): UseEnglishLearningReturn {
    // Words list (local editable)
    const [words, setWords] = useState<WordEntry[]>(MOCK_DB);

    // Selection & Search
    const [selectedId, setSelectedId] = useState<string | null>(MOCK_DB[0]?.id ?? null);
    const [searchTerm, setSearchTerm] = useState("");

    // Graffiti display
    const [showGraffiti, setShowGraffiti] = useState(true);
    const [isDrawingMode, setIsDrawingMode] = useState(false);

    // Note editing
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [noteDraftByWordId, setNoteDraftByWordId] = useState<Record<string, string>>({});
    const [isLoadingNote, setIsLoadingNote] = useState(false);
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [noteError, setNoteError] = useState<string | null>(null);
    const [lastSavedAtByWordId, setLastSavedAtByWordId] = useState<Record<string, string>>({});

    // Graffiti tools
    const [activeTool, setActiveTool] = useState<GraffitiTool>('pen');
    const [activeColor, setActiveColor] = useState(GRAFFITI_COLORS[0]);
    const [brushSize, setBrushSize] = useState(4);

    // Store strokes per word ID
    const [graffitiData, setGraffitiData] = useState<Record<string, Stroke[]>>({});

    // Load words from localStorage (client-only)
    useEffect(() => {
        try {
            const raw = localStorage.getItem(WORDS_STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as unknown;
            if (!Array.isArray(parsed)) return;
            const next = parsed.filter(Boolean) as WordEntry[];
            if (next.length > 0) {
                setWords(next);
                setSelectedId((prev) => prev ?? next[0].id);
            }
        } catch {
            // ignore
        }
    }, []);

    // Persist words to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(WORDS_STORAGE_KEY, JSON.stringify(words));
        } catch {
            // ignore
        }
    }, [words]);

    // Derived: filtered words
    const filteredWords = useMemo(() => 
        words.filter(w =>
            w.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
            w.meaning.includes(searchTerm)
        ), 
        [searchTerm, words]
    );

    // Derived: active word
    const activeWord = useMemo(() => 
        words.find(w => w.id === selectedId),
        [selectedId, words]
    );

    const addWord = useCallback((input: { word: string; meaning: string; pronunciation?: string }) => {
        const word = input.word.trim();
        const meaning = input.meaning.trim();
        const pronunciation = (input.pronunciation || '').trim();
        if (!word || !meaning) return;

        const baseId = word.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
        const used = new Set(words.map(w => w.id));
        let id = baseId || 'word';
        let i = 2;
        while (used.has(id)) {
            id = `${baseId || 'word'}-${i}`;
            i += 1;
        }

        const newWord: WordEntry = {
            id,
            word,
            pronunciation: pronunciation || '/',
            meaning,
            semantics: '',
            tags: ['User'],
            images: [],
            noteContent: `# My Impression\n\n`,
        };

        setWords(prev => [newWord, ...prev]);
        setSelectedId(id);
    }, [words]);

    const noteDraft = useMemo(() => {
        if (!activeWord) return '';
        return noteDraftByWordId[activeWord.id] ?? activeWord.noteContent;
    }, [activeWord, noteDraftByWordId]);

    const lastSavedAt = useMemo(() => {
        if (!activeWord) return null;
        return lastSavedAtByWordId[activeWord.id] ?? null;
    }, [activeWord, lastSavedAtByWordId]);

    // Load note when selection changes
    useEffect(() => {
        let cancelled = false;
        async function run() {
            if (!activeWord) return;
            setNoteError(null);
            setIsEditingNote(false);
            setIsLoadingNote(true);
            try {
                const remote = await fetchEnglishNote(activeWord.id);
                if (cancelled) return;
                if (remote) {
                    setNoteDraftByWordId(prev => ({ ...prev, [activeWord.id]: remote.content_md }));
                    setLastSavedAtByWordId(prev => ({ ...prev, [activeWord.id]: remote.updated_at }));
                } else {
                    // Seed default (mock) into DB once, so the backend has initial data.
                    // If backend is not running, we gracefully fall back to local-only.
                    const defaultContent = activeWord.noteContent;
                    setNoteDraftByWordId(prev => ({
                        ...prev,
                        [activeWord.id]: prev[activeWord.id] ?? defaultContent,
                    }));

                    try {
                        const seeded = await upsertEnglishNote(activeWord.id, defaultContent);
                        if (cancelled) return;
                        setLastSavedAtByWordId(prev => ({ ...prev, [activeWord.id]: seeded.updated_at }));
                    } catch (e) {
                        if (cancelled) return;
                        // Keep UI usable even if backend is down.
                        setNoteError(e instanceof Error ? e.message : 'failed to seed default note');
                    }
                }
            } catch (e) {
                if (cancelled) return;
                setNoteError(e instanceof Error ? e.message : 'failed to load note');
            } finally {
                if (!cancelled) setIsLoadingNote(false);
            }
        }
        void run();
        return () => {
            cancelled = true;
        };
    }, [activeWord]);

    const setNoteDraft = useCallback((content: string) => {
        if (!selectedId) return;
        setNoteDraftByWordId(prev => ({ ...prev, [selectedId]: content }));
    }, [selectedId]);

    const saveNote = useCallback(async () => {
        if (!activeWord) return;
        setIsSavingNote(true);
        setNoteError(null);
        try {
            const dto = await upsertEnglishNote(activeWord.id, noteDraft);
            setLastSavedAtByWordId(prev => ({ ...prev, [activeWord.id]: dto.updated_at }));
            setIsEditingNote(false);
        } catch (e) {
            setNoteError(e instanceof Error ? e.message : 'failed to save note');
        } finally {
            setIsSavingNote(false);
        }
    }, [activeWord, noteDraft]);

    // Derived: current strokes for active word
    const currentStrokes = useMemo(() => {
        if (!activeWord) return EMPTY_STROKES;
        return graffitiData[activeWord.id] || EMPTY_STROKES;
    }, [activeWord, graffitiData]);

    // Graffiti actions
    const handleStrokeChange = useCallback((strokes: Stroke[]) => {
        if (!selectedId) return;
        setGraffitiData(prev => ({
            ...prev,
            [selectedId]: strokes
        }));
    }, [selectedId]);

    const handleUndo = useCallback(() => {
        if (!selectedId) return;
        setGraffitiData(prev => {
            const current = prev[selectedId] || [];
            if (current.length === 0) return prev;
            return {
                ...prev,
                [selectedId]: current.slice(0, -1)
            };
        });
    }, [selectedId]);

    const handleClear = useCallback(() => {
        if (!selectedId) return;
        setGraffitiData(prev => ({
            ...prev,
            [selectedId]: []
        }));
    }, [selectedId]);

    return {
        // Selection
        selectedId,
        setSelectedId,
        
        // Search
        searchTerm,
        setSearchTerm,
        
        // Derived data
        filteredWords,
        activeWord: activeWord ? { ...activeWord, noteContent: noteDraft } : activeWord,

        // Words
        addWord,

        // Note editing
        noteDraft,
        setNoteDraft,
        isEditingNote,
        setIsEditingNote,
        isLoadingNote,
        isSavingNote,
        noteError,
        lastSavedAt,
        saveNote,
        
        // Graffiti display
        showGraffiti,
        setShowGraffiti,
        isDrawingMode,
        setIsDrawingMode,
        
        // Graffiti tools
        activeTool,
        setActiveTool,
        activeColor,
        setActiveColor,
        brushSize,
        setBrushSize,
        
        // Graffiti data
        currentStrokes,
        handleStrokeChange,
        handleUndo,
        handleClear,
        
        // Constants
        graffitiColors: GRAFFITI_COLORS,
    };
}
