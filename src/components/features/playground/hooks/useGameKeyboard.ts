import { useEffect } from 'react';
import { handleSnakeKeyboard, handleTetrisKeyboard } from '@/components/games/controls';

export function useGameKeyboard(
    isPlaying: boolean,
    gameId: string,
    sendAction: (action: number) => void
) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isPlaying) return;

            let action: number | null = null;

            if (gameId === "Tetris") {
                e.preventDefault();
                action = handleTetrisKeyboard(e.key);
            } else if (gameId === "Snake") {
                action = handleSnakeKeyboard(e.key);
            }

            if (action !== null) {
                sendAction(action);
            }
        };
        
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isPlaying, sendAction, gameId]);
}
