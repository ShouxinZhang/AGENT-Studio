"use client";

import React from 'react';
import { Search, Sparkles, ChevronRight, Plus } from 'lucide-react';
import { cn } from "@/lib/utils";
import { WordEntry } from '../types';

interface WordSidebarProps {
    words: WordEntry[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    onAddWord: (input: { word: string; meaning: string; pronunciation?: string }) => void;
}

export function WordSidebar({ 
    words, 
    selectedId, 
    onSelect, 
    searchTerm, 
    onSearchChange,
    onAddWord,
}: WordSidebarProps) {
    const [isAdding, setIsAdding] = React.useState(false);
    const [newWord, setNewWord] = React.useState('');
    const [newMeaning, setNewMeaning] = React.useState('');
    const [newPron, setNewPron] = React.useState('');

    const submit = () => {
        onAddWord({ word: newWord, meaning: newMeaning, pronunciation: newPron });
        setNewWord('');
        setNewMeaning('');
        setNewPron('');
        setIsAdding(false);
    };

    return (
        <aside className="w-80 border-r border-white/10 bg-slate-900/50 backdrop-blur-md flex flex-col shrink-0">
            {/* Search Bar */}
            <div className="p-4 border-b border-white/10">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                        type="text"
                        placeholder="Find a word..."
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-slate-600 transition-all"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>

                <div className="mt-3 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => setIsAdding(v => !v)}
                        className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5"
                        title="Add a new word"
                    >
                        <Plus size={14} /> Add word
                    </button>
                </div>

                {isAdding && (
                    <div className="mt-3 p-3 rounded-xl border border-white/10 bg-slate-900/40 space-y-2">
                        <input
                            value={newWord}
                            onChange={(e) => setNewWord(e.target.value)}
                            placeholder="Word (e.g. resilience)"
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-slate-600"
                        />
                        <input
                            value={newPron}
                            onChange={(e) => setNewPron(e.target.value)}
                            placeholder="Pronunciation (optional)"
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-slate-600"
                        />
                        <input
                            value={newMeaning}
                            onChange={(e) => setNewMeaning(e.target.value)}
                            placeholder="Meaning (e.g. 韧性)"
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-slate-600"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                    e.preventDefault();
                                    submit();
                                }
                            }}
                        />
                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:bg-white/5"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={submit}
                                disabled={!newWord.trim() || !newMeaning.trim()}
                                className="text-xs px-3 py-1.5 rounded-lg border border-indigo-500/30 text-indigo-200 bg-indigo-500/15 hover:bg-indigo-500/25 disabled:opacity-50"
                            >
                                Create
                            </button>
                        </div>
                        <div className="text-[11px] text-slate-500 text-right">Ctrl/Cmd+Enter to create</div>
                    </div>
                )}
            </div>

            {/* Word List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {words.map((word) => (
                    <button
                        key={word.id}
                        onClick={() => onSelect(word.id)}
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
                                selectedId === word.id 
                                    ? "opacity-100 translate-x-0" 
                                    : "opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-50"
                            )} />
                        </div>
                        <div className="text-xs opacity-60 truncate relative z-10">{word.meaning}</div>

                        {/* Glow effect on active */}
                        {selectedId === word.id && (
                            <div className="absolute inset-0 bg-indigo-500/10 blur-xl" />
                        )}
                    </button>
                ))}

                {/* Empty State */}
                {words.length === 0 && (
                    <div className="text-center p-8 text-slate-600">
                        <Sparkles size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No words found.</p>
                    </div>
                )}
            </div>
        </aside>
    );
}
