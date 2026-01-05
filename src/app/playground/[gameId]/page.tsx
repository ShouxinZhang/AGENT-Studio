"use client";

/**
 * Game Page - 游戏页面
 * 
 * 重构后的版本：
 * - 逻辑分离到 hooks
 * - UI 组件化
 */

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { getGameById } from "@/lib/games/registry";
import { usePlaygroundSettingsStore } from "@/lib/store/usePlaygroundSettingsStore";
import { 
    useGameSession, 
    useGameLoop, 
    useGameKeyboard,
    GameHeader,
    GameCanvas,
    GameStats,
    GameSidebar
} from "@/components/features/playground";

export default function GamePage() {
    const params = useParams();
    const gameId = decodeURIComponent(params.gameId as string);
    const gameConfig = getGameById(gameId);
    
    // 游戏会话逻辑
    const {
        isConnected,
        sessionId,
        frame,
        scene,
        steps,
        isPlaying,
        startGame,
        sendAction
    } = useGameSession(gameId);
    
    // UI 状态
    const [showPanel, setShowPanel] = useState(true);

    const displayScale = usePlaygroundSettingsStore((s) => s.displayScale);
    const snakeSettings = usePlaygroundSettingsStore((s) => s.snakeSettings);
    const tetrisSettings = usePlaygroundSettingsStore((s) => s.tetrisSettings);
    const setDisplayScale = usePlaygroundSettingsStore((s) => s.setDisplayScale);
    const setSnakeSettings = usePlaygroundSettingsStore((s) => s.setSnakeSettings);
    const setTetrisSettings = usePlaygroundSettingsStore((s) => s.setTetrisSettings);
    const resetSettings = usePlaygroundSettingsStore((s) => s.resetToDefaults);

    const displayTitle = gameConfig?.name ?? gameId;
    const currentSpeed = gameId === "Tetris" ? tetrisSettings.speed : snakeSettings.speed;

    const [viewport, setViewport] = useState<{ w: number; h: number }>({ w: 1200, h: 800 });

    useEffect(() => {
        const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    // 游戏循环
    useGameLoop(isPlaying, sessionId, gameId, currentSpeed, sendAction);

    // 键盘控制
    useGameKeyboard(isPlaying, gameId, sendAction);

    // 开始游戏处理
    const handleStartGame = useCallback(() => {
        let config: Record<string, unknown>;
        
        if (gameId === "Tetris") {
            config = {
                grid_w: 10,
                grid_h: 20,
                start_level: tetrisSettings.startLevel,
            };
        } else if (gameId === "Snake") {
            config = {
                grid_w: snakeSettings.gridSize,
                grid_h: snakeSettings.gridSize,
                allow_180: snakeSettings.allow180,
                wrap_walls: snakeSettings.wrapWalls,
                die_on_self_collision: snakeSettings.dieOnSelfCollision,
            };
        } else {
            config = {};
        }
        startGame(config);
    }, [gameId, snakeSettings, tetrisSettings, startGame]);

    return (
        <div className="h-screen w-full bg-[#0a0a0f] text-white overflow-hidden flex flex-col">
            <GameHeader 
                title={displayTitle} 
                emoji={gameConfig?.emoji} 
                isConnected={isConnected} 
            />

            <div className="flex-1 flex overflow-hidden">
                <main className="flex-1 overflow-auto p-4 relative">
                    <div className="min-h-full w-full flex flex-col items-center justify-center">
                        {!isPlaying && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex items-center justify-center">
                                <div className="text-center space-y-6">
                                    <div className="text-6xl animate-bounce">{gameConfig?.emoji}</div>
                                    <h2 className="text-3xl font-bold text-white tracking-widest">READY?</h2>
                                    <button
                                        onClick={handleStartGame}
                                        disabled={!isConnected}
                                        className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold text-lg rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/30"
                                    >
                                        {isConnected ? 'START GAME' : 'Connecting...'}
                                    </button>
                                    <p className="text-gray-500 text-sm">or use the sidebar controls →</p>
                                </div>
                            </div>
                        )}

                        <GameStats scene={scene} steps={steps} />

                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-lg blur-xl" />
                            <GameCanvas 
                                gameId={gameId}
                                scene={scene}
                                frame={frame}
                                scale={displayScale}
                                viewport={viewport}
                                showPanel={showPanel}
                            />
                        </div>
                    </div>
                </main>

                <GameSidebar
                    gameId={gameId}
                    showPanel={showPanel}
                    isPlaying={isPlaying}
                    snakeSettings={snakeSettings}
                    tetrisSettings={tetrisSettings}
                    displayScale={displayScale}
                    onTogglePanel={() => setShowPanel(!showPanel)}
                    onAction={sendAction}
                    onStartGame={handleStartGame}
                    onSnakeSettingsChange={setSnakeSettings}
                    onTetrisSettingsChange={setTetrisSettings}
                    onDisplayScaleChange={setDisplayScale}
                    onResetSettings={resetSettings}
                />
            </div>
        </div>
    );
}
