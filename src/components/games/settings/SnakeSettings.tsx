"use client";

/**
 * Snake Settings Panel - Snake 游戏设置面板
 */

import { Slider } from "@/components/ui/slider";
import { SnakeSettings } from '../types';

interface SnakeSettingsPanelProps {
    settings: SnakeSettings;
    onChange: (settings: SnakeSettings) => void;
    disabled?: boolean;
}

export function SnakeSettingsPanel({ settings, onChange, disabled }: SnakeSettingsPanelProps) {
    return (
        <div className="space-y-6">
            {/* Grid Size */}
            <div className="space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Grid Size</span>
                    <span className="text-cyan-400 font-mono">{settings.gridSize} x {settings.gridSize}</span>
                </div>
                <Slider 
                    value={[settings.gridSize]} 
                    min={10} 
                    max={30} 
                    step={1} 
                    onValueChange={(v) => onChange({ ...settings, gridSize: v[0] })} 
                    className="py-2"
                    disabled={disabled}
                />
            </div>

            {/* Speed */}
            <div className="space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Speed</span>
                    <span className="text-cyan-400 font-mono">{settings.speed}ms</span>
                </div>
                <Slider 
                    value={[350 - settings.speed]} 
                    min={50} 
                    max={300} 
                    step={10} 
                    onValueChange={(v) => onChange({ ...settings, speed: 350 - v[0] })} 
                    className="py-2"
                    disabled={disabled}
                />
                <div className="flex justify-between text-xs text-gray-500 px-1">
                    <span>Slow</span>
                    <span>Fast</span>
                </div>
            </div>

            {/* Allow 180 Turn */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex flex-col">
                    <span className="text-gray-300 text-sm">Allow 180° Turn</span>
                    <span className="text-xs text-gray-500">Enable immediate reverse (unsafe)</span>
                </div>
                <button 
                    onClick={() => onChange({ ...settings, allow180: !settings.allow180 })}
                    disabled={disabled}
                    className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${settings.allow180 ? "bg-cyan-500" : "bg-gray-700"} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${settings.allow180 ? "translate-x-6" : "translate-x-0"}`} />
                </button>
            </div>

            {/* Wrap Walls */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex flex-col">
                    <span className="text-gray-300 text-sm">Wrap Walls</span>
                    <span className="text-xs text-gray-500">Go through edges and appear on the other side</span>
                </div>
                <button 
                    onClick={() => onChange({ ...settings, wrapWalls: !settings.wrapWalls })}
                    disabled={disabled}
                    className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${settings.wrapWalls ? "bg-cyan-500" : "bg-gray-700"} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${settings.wrapWalls ? "translate-x-6" : "translate-x-0"}`} />
                </button>
            </div>

            {/* Self Collision */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex flex-col">
                    <span className="text-gray-300 text-sm">Die on Self Collision</span>
                    <span className="text-xs text-gray-500">If off, biting yourself will cut your tail</span>
                </div>
                <button 
                    onClick={() => onChange({ ...settings, dieOnSelfCollision: !settings.dieOnSelfCollision })}
                    disabled={disabled}
                    className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${settings.dieOnSelfCollision ? "bg-cyan-500" : "bg-gray-700"} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${settings.dieOnSelfCollision ? "translate-x-6" : "translate-x-0"}`} />
                </button>
            </div>
        </div>
    );
}
