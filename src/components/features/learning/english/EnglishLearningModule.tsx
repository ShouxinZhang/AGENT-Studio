"use client";

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Hash } from 'lucide-react';

// Internal components
import { WordSidebar } from './components/WordSidebar';
import { WordDetail } from './components/WordDetail';
import { GraffitiToolbar } from './components/GraffitiToolbar';

// Hook
import { useEnglishLearning } from './hooks/useEnglishLearning';

export function EnglishLearningModule() {
    const {
        // Selection
        selectedId,
        setSelectedId,
        
        // Search
        searchTerm,
        setSearchTerm,
        
        // Derived data
        filteredWords,
        activeWord,

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
        graffitiColors,
    } = useEnglishLearning();

    return (
        <div className="h-full w-full flex bg-[#0f172a] text-stone-200 overflow-hidden font-sans">
            {/* Left Sidebar: Word List */}
            <WordSidebar
                words={filteredWords}
                selectedId={selectedId}
                onSelect={setSelectedId}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onAddWord={addWord}
            />

            {/* Main Content */}
            <main className="flex-1 relative overflow-hidden flex flex-col">
                <AnimatePresence mode="wait">
                    {activeWord ? (
                        <WordDetail
                            word={activeWord}
                            noteDraft={noteDraft}
                            onNoteDraftChange={setNoteDraft}
                            isEditingNote={isEditingNote}
                            onEditingNoteChange={setIsEditingNote}
                            isLoadingNote={isLoadingNote}
                            isSavingNote={isSavingNote}
                            noteError={noteError}
                            lastSavedAt={lastSavedAt}
                            onSaveNote={saveNote}
                            showGraffiti={showGraffiti}
                            onShowGraffitiChange={setShowGraffiti}
                            isDrawingMode={isDrawingMode}
                            onDrawingModeChange={setIsDrawingMode}
                            currentStrokes={currentStrokes}
                            onStrokeChange={handleStrokeChange}
                            activeTool={activeTool}
                            activeColor={activeColor}
                            brushSize={brushSize}
                        />
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
                    <GraffitiToolbar
                        activeTool={activeTool}
                        onToolChange={setActiveTool}
                        activeColor={activeColor}
                        onColorChange={setActiveColor}
                        brushSize={brushSize}
                        onBrushSizeChange={setBrushSize}
                        colors={graffitiColors}
                        onUndo={handleUndo}
                        onClear={handleClear}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
