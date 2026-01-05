"use client";

/**
 * Tetris Settings Panel - 俄罗斯方块设置面板
 */

import { Slider } from "@/components/ui/slider";
import { TetrisSettings } from '../types';

interface TetrisSettingsPanelProps {
    settings: TetrisSettings;
    onChange: (settings: TetrisSettings) => void;
    disabled?: boolean;
}

export function TetrisSettingsPanel({ settings, onChange, disabled }: TetrisSettingsPanelProps) {
    return (
        <div className="space-y-6">
            {/* Speed */}
            <div className="space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Drop Speed</span>
                    <span className="text-cyan-400 font-mono">{settings.speed}ms</span>
                </div>
                <Slider 
                    value={[1000 - settings.speed]} 
                    min={100} 
                    max={900} 
                    step={50} 
                    onValueChange={(v) => onChange({ ...settings, speed: 1000 - v[0] })} 
                    className="py-2"
                    disabled={disabled}
                />
                <div className="flex justify-between text-xs text-gray-500 px-1">
                    <span>Slow</span>
                    <span>Fast</span>
                </div>
            </div>

            {/* Start Level */}
            <div className="space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Start Level</span>
                    <span className="text-cyan-400 font-mono">{settings.startLevel}</span>
                </div>
                <Slider 
                    value={[settings.startLevel]} 
                    min={1} 
                    max={15} 
                    step={1} 
                    onValueChange={(v) => onChange({ ...settings, startLevel: v[0] })} 
                    className="py-2"
                    disabled={disabled}
                />
                <div className="flex justify-between text-xs text-gray-500 px-1">
                    <span>Level 1</span>
                    <span>Level 15</span>
                </div>
            </div>
        </div>
    );
}
