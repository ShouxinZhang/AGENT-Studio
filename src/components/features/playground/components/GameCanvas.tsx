import { useEffect, useRef } from 'react';
import { GameScene, SnakeScene, TetrisScene, DoudizhuScene } from '@/components/games/types';
import { renderSnake, renderTetris, renderDoudizhu } from '@/components/games/renderers';

interface GameCanvasProps {
    gameId: string;
    scene: GameScene | null;
    frame: string | null;
    scale: number;
    viewport: { w: number; h: number };
    showPanel: boolean;
}

export function GameCanvas({ gameId, scene, frame, scale, viewport, showPanel }: GameCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const panelW = showPanel ? 288 : 0;
    const availableW = Math.max(320, viewport.w - panelW - 80);
    const availableH = Math.max(420, viewport.h - 140);
    const containerW = Math.min(980, availableW);
    const containerH = Math.min(900, availableH);

    const scaledW = Math.floor(containerW * (scale / 100));
    const scaledH = Math.floor(containerH * (scale / 100));

    // Render Snake
    useEffect(() => {
        if (!scene || gameId !== "Snake") return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const snakeScene = scene as SnakeScene;
        const cell = Math.min(scaledW / snakeScene.grid.w, scaledH / snakeScene.grid.h);
        const width = Math.floor(snakeScene.grid.w * cell);
        const height = Math.floor(snakeScene.grid.h * cell);

        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        renderSnake(ctx, snakeScene, scaledW, scaledH);
    }, [scene, gameId, scaledW, scaledH]);

    // Render Tetris
    useEffect(() => {
        if (!scene || gameId !== "Tetris") return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const tetrisScene = scene as TetrisScene;
        const cellSize = Math.min(
            scaledW / (tetrisScene.grid.w + 8),
            scaledH / tetrisScene.grid.h
        );
        const boardW = tetrisScene.grid.w * cellSize;
        const boardH = tetrisScene.grid.h * cellSize;
        const totalW = boardW + cellSize * 7;

        canvas.width = Math.floor(totalW);
        canvas.height = Math.floor(boardH);

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        renderTetris(ctx, tetrisScene, scaledW, scaledH);
    }, [scene, gameId, scaledW, scaledH]);

    // Render Doudizhu
    useEffect(() => {
        if (!scene || gameId !== "Doudizhu") return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const doudizhuScene = scene as DoudizhuScene;
        
        // Fixed aspect ratio for card game
        const width = Math.min(scaledW, 800);
        const height = Math.min(scaledH, 600);

        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        renderDoudizhu(ctx, doudizhuScene, width, height);
    }, [scene, gameId, scaledW, scaledH]);

    if (frame) {
        const src = frame.startsWith("data:") ? frame : `data:image/png;base64,${frame}`;
        return (
             <img
                src={src}
                alt="Game Frame"
                className="max-w-full max-h-full object-contain shadow-2xl rounded-lg border border-white/10"
                style={{
                    width: scaledW,
                    height: scaledH
                }}
            />
        );
    }

    return (
        <canvas
            ref={canvasRef}
            className="shadow-2xl rounded-lg border border-white/10 bg-[#0f172a]"
        />
    );
}
