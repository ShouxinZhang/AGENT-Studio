import { useState } from 'react';
import { Gamepad2, Settings, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SnakeControls, TetrisControls, SnakeKeyboardHelp } from '@/components/games/controls';
import { SnakeSettingsPanel, TetrisSettingsPanel } from '@/components/games/settings';
import { SnakeSettings, TetrisSettings } from '@/components/games/types';

interface GameSidebarProps {
    gameId: string;
    showPanel: boolean;
    isPlaying: boolean;
    snakeSettings: SnakeSettings;
    tetrisSettings: TetrisSettings;
    displayScale: number;
    onTogglePanel: () => void;
    onAction: (action: number) => void;
    onStartGame: () => void;
    onSnakeSettingsChange: (s: SnakeSettings) => void;
    onTetrisSettingsChange: (s: TetrisSettings) => void;
    onDisplayScaleChange: (scale: number) => void;
    onResetSettings: () => void;
}

export function GameSidebar({
    gameId,
    showPanel,
    isPlaying,
    snakeSettings,
    tetrisSettings,
    displayScale,
    onTogglePanel,
    onAction,
    onStartGame,
    onSnakeSettingsChange,
    onTetrisSettingsChange,
    onDisplayScaleChange,
    onResetSettings
}: GameSidebarProps) {
    const [activeTab, setActiveTab] = useState<'controls' | 'settings'>('controls');

    return (
        <>
            <aside className={`bg-[#0d0d15] border-l border-white/5 transition-all duration-300 flex flex-col ${showPanel ? 'w-72' : 'w-0'}`}>
                {showPanel && (
                    <>
                        <div className="flex border-b border-white/5">
                            <button
                                onClick={() => setActiveTab('controls')}
                                className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                                    activeTab === 'controls' ? 'text-white bg-white/5' : 'text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                <Gamepad2 size={14} /> Controls
                            </button>
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                                    activeTab === 'settings' ? 'text-white bg-white/5' : 'text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                <Settings size={14} /> Settings
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {activeTab === 'controls' ? (
                                <div className="space-y-6">
                                    <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-4">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Game Control</h3>
                                        <Button 
                                            className={`w-full font-bold tracking-wide ${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                                            onClick={onStartGame}
                                            disabled={isPlaying}
                                        >
                                            {isPlaying ? 'PLAYING...' : 'START GAME'}
                                        </Button>
                                    </div>

                                    <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-4">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Manual Control</h3>
                                        {gameId === "Snake" && <SnakeControls onAction={onAction} disabled={!isPlaying} />}
                                        {gameId === "Tetris" && <TetrisControls onAction={onAction} disabled={!isPlaying} />}
                                    </div>

                                    {gameId === "Snake" && (
                                        <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-4">
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Keyboard Shortcuts</h3>
                                            <SnakeKeyboardHelp />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-4">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Display</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-xs text-gray-400">
                                                <span>Scale</span>
                                                <span>{displayScale}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="50"
                                                max="160"
                                                step="10"
                                                value={displayScale}
                                                onChange={(e) => onDisplayScaleChange(Number(e.target.value))}
                                                className="w-full accent-cyan-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            onClick={onResetSettings}
                                            disabled={isPlaying}
                                        >
                                            Reset to Defaults
                                        </Button>
                                    </div>

                                    {gameId === "Snake" && (
                                        <SnakeSettingsPanel
                                            settings={snakeSettings}
                                            onChange={onSnakeSettingsChange}
                                            disabled={isPlaying}
                                        />
                                    )}
                                    {gameId === "Tetris" && (
                                        <TetrisSettingsPanel
                                            settings={tetrisSettings}
                                            onChange={onTetrisSettingsChange}
                                            disabled={isPlaying}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </aside>

            <button
                onClick={onTogglePanel}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#0d0d15] border border-white/10 rounded-l-lg p-2 text-gray-400 hover:text-white transition-colors z-10"
                style={{ right: showPanel ? '288px' : '0' }}
            >
                {showPanel ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
        </>
    );
}
