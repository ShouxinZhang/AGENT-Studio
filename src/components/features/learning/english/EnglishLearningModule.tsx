"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Volume2, Book, PenTool, Sparkles, ChevronRight, Hash, Eye, EyeOff, Edit3, Pencil, Eraser, Undo, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GraffitiCanvas, Stroke } from './components/GraffitiCanvas';
import { cn } from "@/lib/utils";

// Stable empty array to prevent infinite loops
const EMPTY_STROKES: Stroke[] = [];
const GRAFFITI_COLORS = ['#FF0055', '#00FFFF', '#FFFF00', '#00FF00', '#FFFFFF'];

// --- Types ---
interface WordEntry {
    id: string;
    word: string;
    pronunciation: string;
    meaning: string;
    semantics: string; // concise English sentence
    tags: string[];
    images: string[];
    noteContent: string; // Markdown
}

// --- Mock Data ---
const MOCK_DB: WordEntry[] = [
    {
        id: "serendipity",
        word: "Serendipity",
        pronunciation: "/ˌsɛrənˈdɪpɪti/",
        meaning: "意外发现珍奇事物的本领",
        semantics: "The occurrence of events by chance in a happy or beneficial way.",
        tags: ["Noun", "Positive", "Literary"],
        images: [
            "https://images.unsplash.com/photo-1540679093836-8cf9cbced60c?auto=format&fit=crop&q=80&w=800", // abstract aurora
            "https://images.unsplash.com/photo-1507908708918-778587c9e563?auto=format&fit=crop&q=80&w=800"  // starry night
        ],
        noteContent: `
# My Impression

It's like finding a **$20 bill** in an old pair of jeans.

> "I didn't lose the gold watch, I found the sunset."

## Usage
- It was pure *serendipity* that we met at the coffee shop.
- Science is full of serendipity.

## Synonyms
- Fluke
- Happy accident
`
    },
    {
        id: "ethereal",
        word: "Ethereal",
        pronunciation: "/ɪˈθɪərɪəl/",
        meaning: "超凡脱俗的；飘渺的",
        semantics: "Extremely delicate and light in a way that seems too perfect for this world.",
        tags: ["Adjective", "Beautiful", "Nature"],
        images: [
            "https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&q=80&w=800", // misty galaxy/sky
            "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=800"  // fog
        ],
        noteContent: `
# Feeling

*Something like elf magic.* 

When the morning mist covers the lake, the scene is truly **ethereal**.

*   Light
*   Airy
*   Tenous
`
    },
    {
        id: "ephemeral",
        word: "Ephemeral",
        pronunciation: "/ɪˈfɛmərəl/",
        meaning: "短暂的；朝生暮死的",
        semantics: "Lasting for a very short time.",
        tags: ["Adjective", "Time", "Philosophy"],
        images: [
            "https://images.unsplash.com/photo-1589656966895-2f33e7653819?auto=format&fit=crop&q=80&w=800", // soap bubble
            "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=800"  // flower
        ],
        noteContent: `
# Thoughts

**Life is ephemeral.** 

Like a *cherry blossom* falling.

> "Fashions are ephemeral, changing with every season."
`
    }
];

export function EnglishLearningModule() {
    const [selectedId, setSelectedId] = useState<string | null>(MOCK_DB[0].id);
    const [searchTerm, setSearchTerm] = useState("");
    const [showGraffiti, setShowGraffiti] = useState(true);
    const [isDrawingMode, setIsDrawingMode] = useState(false);

    // Tool states
    const [activeTool, setActiveTool] = useState<'pen' | 'eraser'>('pen');
    const [activeColor, setActiveColor] = useState(GRAFFITI_COLORS[0]);
    const [brushSize, setBrushSize] = useState(4);

    // Store strokes per word ID
    const [graffitiData, setGraffitiData] = useState<Record<string, Stroke[]>>({});

    const filteredWords = MOCK_DB.filter(w =>
        w.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.meaning.includes(searchTerm)
    );

    const activeWord = MOCK_DB.find(w => w.id === selectedId);

    const handleStrokeChange = (strokes: Stroke[]) => {
        if (!selectedId) return;
        setGraffitiData(prev => ({
            ...prev,
            [selectedId]: strokes
        }));
    };

    const handleUndo = () => {
        if (!selectedId) return;
        const current = graffitiData[selectedId] || [];
        if (current.length > 0) {
            handleStrokeChange(current.slice(0, -1));
        }
    };

    const handleClear = () => {
        if (!selectedId) return;
        handleStrokeChange([]);
    };

    // Use stable reference for strokes
    const currentStrokes = useMemo(() => {
        if (!activeWord) return EMPTY_STROKES;
        return graffitiData[activeWord.id] || EMPTY_STROKES;
    }, [activeWord, graffitiData]);

    return (
        <div className="h-full w-full flex bg-[#0f172a] text-stone-200 overflow-hidden font-sans">
            {/* Left Sidebar: Word List */}
            <aside className="w-80 border-r border-white/10 bg-slate-900/50 backdrop-blur-md flex flex-col shrink-0">
                <div className="p-4 border-b border-white/10">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Find a word..."
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-slate-600 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {filteredWords.map((word) => (
                        <button
                            key={word.id}
                            onClick={() => setSelectedId(word.id)}
                            className={cn(
                                "w-full text-left px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                selectedId === word.id
                                    ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-white border border-indigo-500/30"
                                    : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-transparent"
                            )}
                        >
                            <div className="flex justify-between items-baseline relative z-10">
                                <span className="font-bold text-lg">{word.word}</span>
                                <ChevronRight size={14} className={cn(
                                    "transition-transform duration-300",
                                    selectedId === word.id ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-50"
                                )} />
                            </div>
                            <div className="text-xs opacity-60 truncate relative z-10">{word.meaning}</div>

                            {/* Simple glow effect on active */}
                            {selectedId === word.id && (
                                <div className="absolute inset-0 bg-indigo-500/10 blur-xl" />
                            )}
                        </button>
                    ))}

                    {filteredWords.length === 0 && (
                        <div className="text-center p-8 text-slate-600">
                            <Sparkles size={32} className="mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No words found.</p>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 relative overflow-hidden flex flex-col">
                <AnimatePresence mode="wait">
                    {activeWord ? (
                        <motion.div
                            key={activeWord.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="flex-1 overflow-y-auto relative custom-scrollbar flex flex-col"
                        >
                            {/* Hero Section / Backdrop */}
                            <div className="relative h-64 md:h-80 shrink-0 w-full overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f172a]/80 to-[#0f172a] z-10" />
                                <div className="absolute inset-0 grid grid-cols-2 gap-0.5 opacity-60">
                                    {activeWord.images.map((img, idx) => (
                                        <div key={idx} className="relative h-full w-full">
                                            <img src={img} alt="context" className="object-cover w-full h-full" />
                                        </div>
                                    ))}
                                </div>

                                <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                                    <div className="max-w-4xl mx-auto">
                                        <div className="flex items-center gap-3 mb-2">
                                            {activeWord.tags.map(tag => (
                                                <span key={tag} className="px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-[10px] uppercase font-bold tracking-wider backdrop-blur-sm border border-white/5">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <h1 className="text-6xl md:text-8xl font-black tracking-tight text-white drop-shadow-2xl">
                                            {activeWord.word}
                                        </h1>
                                        <div className="flex items-center gap-4 mt-2 text-xl text-indigo-300">
                                            <span className="font-mono">{activeWord.pronunciation}</span>
                                            <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
                                                <Volume2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Content Body */}
                            <div className="flex-1 relative z-10 w-full max-w-4xl mx-auto px-8 pb-20">
                                {/* Definition Block */}
                                <div className="mb-12 p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm">
                                    <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Book size={14} /> Meaning
                                    </h3>
                                    <p className="text-2xl text-white font-serif italic leading-relaxed">
                                        &ldquo;{activeWord.semantics}&rdquo;
                                    </p>
                                    <p className="mt-2 text-slate-400 text-lg">
                                        {activeWord.meaning}
                                    </p>
                                </div>

                                {/* Impression Note - Supports Graffiti */}
                                <div className="relative group">
                                    <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-cyan-500/5 blur-xl -z-10 group-hover:from-pink-500/10 transition-all duration-700" />

                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-semibold text-pink-400 uppercase tracking-widest flex items-center gap-2">
                                            <PenTool size={14} /> Impression Note
                                        </h3>

                                        <div className="flex items-center gap-2">
                                            {showGraffiti && (
                                                <button
                                                    onClick={() => setIsDrawingMode(!isDrawingMode)}
                                                    className={cn(
                                                        "text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-2",
                                                        isDrawingMode
                                                            ? "bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20"
                                                            : "bg-transparent text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-300"
                                                    )}
                                                >
                                                    <Edit3 size={12} />
                                                    {isDrawingMode ? "Drawing Mode" : "View Mode"}
                                                </button>
                                            )}

                                            <button
                                                onClick={() => setShowGraffiti(!showGraffiti)}
                                                className={cn(
                                                    "text-xs px-2 py-1.5 rounded-full border transition-colors flex items-center gap-2",
                                                    showGraffiti ? "bg-pink-500/10 text-pink-300 border-pink-500/30" : "bg-transparent text-slate-500 border-slate-700"
                                                )}
                                                title={showGraffiti ? "Hide Graffiti Layer" : "Show Graffiti Layer"}
                                            >
                                                {showGraffiti ? <Eye size={14} /> : <EyeOff size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="relative min-h-[300px] rounded-2xl bg-[#131b2e] border border-slate-700/50 p-8 shadow-2xl">
                                        {/* Underlying Markdown Content */}
                                        <div className="prose prose-invert prose-indigo max-w-none select-text">
                                            <ReactMarkdown
                                                components={{
                                                    h1: (props) => <h1 className="text-2xl font-bold text-white mb-4 border-b border-white/10 pb-2" {...props} />,
                                                    h2: (props) => <h2 className="text-xl font-semibold text-indigo-200 mt-6 mb-3" {...props} />,
                                                    p: (props) => <p className="text-slate-300 leading-7 mb-4" {...props} />,
                                                    blockquote: (props) => <blockquote className="border-l-4 border-pink-500/50 pl-4 py-1 my-4 italic text-slate-400 bg-pink-500/5 rounded-r" {...props} />,
                                                    ul: (props) => <ul className="list-disc list-inside space-y-1 text-slate-300 mb-4" {...props} />,
                                                    li: (props) => <li className="pl-2" {...props} />
                                                }}
                                            >
                                                {activeWord.noteContent}
                                            </ReactMarkdown>
                                        </div>

                                        {/* Graffiti Overlay */}
                                        {showGraffiti && (
                                            <GraffitiCanvas
                                                className="absolute inset-0"
                                                strokes={currentStrokes}
                                                onStrokeChange={handleStrokeChange}
                                                readOnly={!isDrawingMode}
                                                tool={activeTool}
                                                color={activeColor}
                                                brushSize={brushSize}
                                            />
                                        )}
                                    </div>
                                    <div className="mt-2 text-center text-xs text-slate-600 flex justify-center gap-4">
                                        <span>Markdown is rendered underneath.</span>
                                        {isDrawingMode && <span className="text-indigo-400">Drawing enabled.</span>}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center flex-col text-slate-600">
                            <Hash size={48} className="mb-4 opacity-20" />
                            <p>Select a word to start learning</p>
                        </div>
                    )}
                </AnimatePresence>
            </main>

            {/* Graffiti Tool Sidebar */}
            <AnimatePresence>
                {isDrawingMode && (
                    <motion.aside
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="fixed right-6 top-1/2 -translate-y-1/2 z-[100] flex flex-col gap-4 p-3 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl"
                    >
                        {/* Tools */}
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => setActiveTool('pen')}
                                className={cn(
                                    "p-3 rounded-xl transition-all",
                                    activeTool === 'pen' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:bg-white/10 hover:text-white"
                                )}
                                title="Pen Tool"
                            >
                                <Pencil size={20} />
                            </button>
                            <button
                                onClick={() => setActiveTool('eraser')}
                                className={cn(
                                    "p-3 rounded-xl transition-all",
                                    activeTool === 'eraser' ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20" : "text-slate-400 hover:bg-white/10 hover:text-white"
                                )}
                                title="Eraser Tool"
                            >
                                <Eraser size={20} />
                            </button>
                        </div>

                        <div className="h-px bg-white/10 mx-1" />

                        {/* Colors */}
                        <div className="flex flex-col gap-3 p-1">
                            {GRAFFITI_COLORS.map(color => (
                                <button
                                    key={color}
                                    onClick={() => {
                                        setActiveColor(color);
                                        setActiveTool('pen');
                                    }}
                                    className={cn(
                                        "w-8 h-8 rounded-full border-2 transition-all hover:scale-110",
                                        activeColor === color && activeTool === 'pen' ? "border-white ring-4 ring-white/10" : "border-transparent"
                                    )}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>

                        <div className="h-px bg-white/10 mx-1" />

                        {/* Brush Size Slider */}
                        <div className="flex flex-col gap-2 p-2 items-center">
                            <div className="text-[10px] font-mono text-slate-400 mb-1">{brushSize}px</div>
                            <div className="h-32 flex items-center justify-center py-2">
                                <input
                                    type="range"
                                    min="1"
                                    max="50"
                                    step="1"
                                    value={brushSize}
                                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                    className="h-full w-1.5 bg-slate-700/50 rounded-full appearance-none cursor-pointer 
                                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-lg hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
                                    style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                                    title={`Brush Size: ${brushSize}px`}
                                />
                            </div>
                        </div>

                        <div className="h-px bg-white/10 mx-1" />

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handleUndo}
                                className="p-3 text-slate-400 hover:bg-white/10 hover:text-white rounded-xl transition-colors"
                                title="Undo"
                            >
                                <Undo size={20} />
                            </button>
                            <button
                                onClick={handleClear}
                                className="p-3 text-red-400/70 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-colors"
                                title="Clear All"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
        </div>
    );
}
