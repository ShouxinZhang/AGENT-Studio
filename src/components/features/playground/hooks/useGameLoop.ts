import { useEffect } from 'react';

export function useGameLoop(
    isPlaying: boolean,
    sessionId: string | null,
    gameId: string,
    speed: number,
    sendAction: (action: number) => void
) {
    useEffect(() => {
        if (!isPlaying || !sessionId) return;
        if (gameId !== "Snake" && gameId !== "Tetris") return;

        const timer = setInterval(() => {
            sendAction(-1);
        }, speed);

        return () => clearInterval(timer);
    }, [isPlaying, sessionId, gameId, sendAction, speed]);
}
