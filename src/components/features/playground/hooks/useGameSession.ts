import { useState, useCallback, useEffect } from 'react';
import { BackendState, StartResponse, StepResponse } from '../types';
import { GameScene } from '@/components/games/types';

const BACKEND_URL = "http://localhost:8000";

export function useGameSession(gameId: string) {
    const [isConnected, setIsConnected] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [frame, setFrame] = useState<string | null>(null);
    const [scene, setScene] = useState<GameScene | null>(null);
    const [totalReward, setTotalReward] = useState(0);
    const [steps, setSteps] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // Health check
    useEffect(() => {
        const checkHealth = async () => {
            try {
                const res = await fetch(`${BACKEND_URL}/health`);
                setIsConnected(res.ok);
            } catch {
                setIsConnected(false);
            }
        };
        checkHealth();
        const interval = setInterval(checkHealth, 5000);
        return () => clearInterval(interval);
    }, []);

    const applyBackendState = useCallback((state: BackendState) => {
        const render = state.render;
        if (render && render.mode === "scene") {
            setScene(render.scene as GameScene);
            setFrame(null);
        } else {
            const nextFrame = (render && render.mode === "frame" ? render.frame : undefined) ?? state.frame ?? null;
            setFrame(nextFrame);
            setScene(null);
        }
    }, []);

    const startGame = useCallback(async (config: Record<string, unknown>) => {
        if (!isConnected) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/game/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ env_id: gameId, config })
            });
            const data = (await res.json()) as StartResponse;
            setSessionId(data.session_id);
            applyBackendState(data.state);
            setTotalReward(0);
            setSteps(0);
            setIsPlaying(true);
        } catch (e) {
            console.error("Error starting game:", e);
        }
    }, [isConnected, gameId, applyBackendState]);

    const sendAction = useCallback(async (action: number) => {
        if (!sessionId || !isPlaying) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/game/${sessionId}/step`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action })
            });
            const data = (await res.json()) as StepResponse;
            applyBackendState(data);
            setTotalReward(prev => prev + (data.reward ?? 0));
            setSteps(prev => prev + 1);

            if (data.done || data.truncated) {
                setIsPlaying(false);
            }
        } catch (e) {
            console.error("Error:", e);
        }
    }, [sessionId, isPlaying, applyBackendState]);

    return {
        isConnected,
        sessionId,
        frame,
        scene,
        totalReward,
        steps,
        isPlaying,
        startGame,
        sendAction
    };
}
