"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Volume2, Book, PenTool, Eye, EyeOff, Edit3, Save, FileEdit, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from "@/lib/utils";
import { WordEntry, Stroke, GraffitiTool } from '../types';
import { GraffitiCanvas } from './GraffitiCanvas';
import { MarkdownEditor } from './MarkdownEditor';

interface WordDetailProps {
    word: WordEntry;

    // Note editing
    noteDraft: string;
    onNoteDraftChange: (content: string) => void;
    isEditingNote: boolean;
    onEditingNoteChange: (editing: boolean) => void;
    isLoadingNote: boolean;
    isSavingNote: boolean;
    noteError: string | null;
    lastSavedAt: string | null;
    onSaveNote: () => Promise<void>;

    // Graffiti display props
    showGraffiti: boolean;
    onShowGraffitiChange: (show: boolean) => void;
    isDrawingMode: boolean;
    onDrawingModeChange: (mode: boolean) => void;
    // Graffiti canvas props
    currentStrokes: Stroke[];
    onStrokeChange: (strokes: Stroke[]) => void;
    activeTool: GraffitiTool;
    activeColor: string;
    brushSize: number;
}

export function WordDetail({
    word,
    noteDraft,
    onNoteDraftChange,
    isEditingNote,
    onEditingNoteChange,
    isLoadingNote,
    isSavingNote,
    noteError,
    lastSavedAt,
    onSaveNote,
    showGraffiti,
    onShowGraffitiChange,
    isDrawingMode,
    onDrawingModeChange,
    currentStrokes,
    onStrokeChange,
    activeTool,
    activeColor,
    brushSize,
}: WordDetailProps) {
    return (
        <motion.div
            key={word.id}
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
                    {word.images.map((img, idx) => (
                        <div key={idx} className="relative h-full w-full">
                            <img src={img} alt="context" className="object-cover w-full h-full" />
                        </div>
                    ))}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 mb-2">
                            {word.tags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-[10px] uppercase font-bold tracking-wider backdrop-blur-sm border border-white/5">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tight text-white drop-shadow-2xl">
                            {word.word}
                        </h1>
                        <div className="flex items-center gap-4 mt-2 text-xl text-indigo-300">
                            <span className="font-mono">{word.pronunciation}</span>
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
                        &ldquo;{word.semantics}&rdquo;
                    </p>
                    <p className="mt-2 text-slate-400 text-lg">
                        {word.meaning}
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
                            <button
                                onClick={() => onEditingNoteChange(!isEditingNote)}
                                className={cn(
                                    "text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-2",
                                    isEditingNote
                                        ? "bg-slate-200/10 text-white border-white/20"
                                        : "bg-transparent text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-300"
                                )}
                                title={isEditingNote ? "View" : "Edit"}
                                disabled={isLoadingNote}
                            >
                                <FileEdit size={12} />
                                {isEditingNote ? "Preview" : "Edit"}
                            </button>

                            <button
                                onClick={() => void onSaveNote()}
                                className={cn(
                                    "text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-2",
                                    "bg-indigo-500/15 text-indigo-200 border-indigo-500/30 hover:bg-indigo-500/25"
                                )}
                                disabled={isSavingNote || isLoadingNote}
                                title="Save"
                            >
                                {isSavingNote ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                {isSavingNote ? "Saving" : "Save"}
                            </button>

                            {showGraffiti && (
                                <button
                                    onClick={() => onDrawingModeChange(!isDrawingMode)}
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
                                onClick={() => onShowGraffitiChange(!showGraffiti)}
                                className={cn(
                                    "text-xs px-2 py-1.5 rounded-full border transition-colors flex items-center gap-2",
                                    showGraffiti 
                                        ? "bg-pink-500/10 text-pink-300 border-pink-500/30" 
                                        : "bg-transparent text-slate-500 border-slate-700"
                                )}
                                title={showGraffiti ? "Hide Graffiti Layer" : "Show Graffiti Layer"}
                            >
                                {showGraffiti ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                        </div>
                    </div>

                    <div className="relative min-h-[300px] rounded-2xl bg-[#131b2e] border border-slate-700/50 p-8 shadow-2xl">
                        {/* Underlying Content */}
                        {isLoadingNote ? (
                            <div className="text-slate-500 text-sm flex items-center gap-2">
                                <Loader2 size={14} className="animate-spin" /> Loading note...
                            </div>
                        ) : isEditingNote ? (
                            <MarkdownEditor
                                value={noteDraft}
                                onChange={onNoteDraftChange}
                                disabled={isSavingNote}
                            />
                        ) : (
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
                                    {noteDraft}
                                </ReactMarkdown>
                            </div>
                        )}

                        {/* Graffiti Overlay */}
                        {showGraffiti && !isEditingNote && (
                            <GraffitiCanvas
                                className="absolute inset-0"
                                strokes={currentStrokes}
                                onStrokeChange={onStrokeChange}
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

                    <div className="mt-2 text-center text-xs text-slate-500">
                        {noteError ? (
                            <span className="text-red-400">{noteError}</span>
                        ) : lastSavedAt ? (
                            <span>Saved: {new Date(lastSavedAt).toLocaleString()}</span>
                        ) : (
                            <span>Not saved yet</span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
