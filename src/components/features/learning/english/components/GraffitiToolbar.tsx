"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Pencil, Eraser, Undo, Trash2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { GraffitiTool } from '../types';

interface GraffitiToolbarProps {
    activeTool: GraffitiTool;
    onToolChange: (tool: GraffitiTool) => void;
    activeColor: string;
    onColorChange: (color: string) => void;
    brushSize: number;
    onBrushSizeChange: (size: number) => void;
    colors: string[];
    onUndo: () => void;
    onClear: () => void;
}

export function GraffitiToolbar({
    activeTool,
    onToolChange,
    activeColor,
    onColorChange,
    brushSize,
    onBrushSizeChange,
    colors,
    onUndo,
    onClear,
}: GraffitiToolbarProps) {
    return (
        <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed right-6 top-1/2 -translate-y-1/2 z-[100] flex flex-col gap-4 p-3 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl"
        >
            {/* Tools */}
            <div className="flex flex-col gap-2">
                <button
                    onClick={() => onToolChange('pen')}
                    className={cn(
                        "p-3 rounded-xl transition-all",
                        activeTool === 'pen' 
                            ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                            : "text-slate-400 hover:bg-white/10 hover:text-white"
                    )}
                    title="Pen Tool"
                >
                    <Pencil size={20} />
                </button>
                <button
                    onClick={() => onToolChange('eraser')}
                    className={cn(
                        "p-3 rounded-xl transition-all",
                        activeTool === 'eraser' 
                            ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20" 
                            : "text-slate-400 hover:bg-white/10 hover:text-white"
                    )}
                    title="Eraser Tool"
                >
                    <Eraser size={20} />
                </button>
            </div>

            <div className="h-px bg-white/10 mx-1" />

            {/* Colors */}
            <div className="flex flex-col gap-3 p-1">
                {colors.map(color => (
                    <button
                        key={color}
                        onClick={() => {
                            onColorChange(color);
                            onToolChange('pen');
                        }}
                        className={cn(
                            "w-8 h-8 rounded-full border-2 transition-all hover:scale-110",
                            activeColor === color && activeTool === 'pen' 
                                ? "border-white ring-4 ring-white/10" 
                                : "border-transparent"
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
                        onChange={(e) => onBrushSizeChange(parseInt(e.target.value))}
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
                    onClick={onUndo}
                    className="p-3 text-slate-400 hover:bg-white/10 hover:text-white rounded-xl transition-colors"
                    title="Undo"
                >
                    <Undo size={20} />
                </button>
                <button
                    onClick={onClear}
                    className="p-3 text-red-400/70 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-colors"
                    title="Clear All"
                >
                    <Trash2 size={20} />
                </button>
            </div>
        </motion.aside>
    );
}
