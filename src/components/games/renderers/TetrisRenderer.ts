/**
 * Tetris Renderer - 俄罗斯方块渲染器
 */

import { TetrisScene } from '../types';

// Tetris 方块颜色
const TETRIS_COLORS = [
    '#00f5ff', // I - Cyan
    '#ffff00', // O - Yellow
    '#a855f7', // T - Purple
    '#22c55e', // S - Green
    '#ef4444', // Z - Red
    '#3b82f6', // J - Blue
    '#f97316', // L - Orange
];

export function renderTetris(
    ctx: CanvasRenderingContext2D,
    scene: TetrisScene,
    containerW: number = 600,
    containerH: number = 400
): { width: number; height: number } {
    const cellSize = Math.min(containerW / (scene.grid.w + 8), containerH / scene.grid.h);
    const boardW = scene.grid.w * cellSize;
    const boardH = scene.grid.h * cellSize;
    const totalW = boardW + cellSize * 7;

    // Background
    const gradient = ctx.createLinearGradient(0, 0, totalW, boardH);
    gradient.addColorStop(0, "#0f172a");
    gradient.addColorStop(1, "#1e1b4b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, totalW, boardH);

    // Board border
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 3;
    ctx.strokeRect(1, 1, boardW - 2, boardH - 2);

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= scene.grid.w; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellSize, 0);
        ctx.lineTo(x * cellSize, boardH);
        ctx.stroke();
    }
    for (let y = 0; y <= scene.grid.h; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellSize);
        ctx.lineTo(boardW, y * cellSize);
        ctx.stroke();
    }

    // Draw ghost piece
    ctx.globalAlpha = 0.3;
    scene.ghostCells.forEach(([gx, gy]) => {
        if (gy >= 0) {
            ctx.fillStyle = TETRIS_COLORS[scene.currentPiece.color];
            ctx.fillRect(gx * cellSize + 1, gy * cellSize + 1, cellSize - 2, cellSize - 2);
        }
    });
    ctx.globalAlpha = 1.0;

    // Draw board cells (includes current piece)
    for (let y = 0; y < scene.grid.h; y++) {
        for (let x = 0; x < scene.grid.w; x++) {
            const cell = scene.board[y][x];
            if (cell !== -1) {
                const color = TETRIS_COLORS[cell];
                
                // Cell background
                ctx.fillStyle = color;
                ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
                
                // 3D effect - highlight
                ctx.fillStyle = "rgba(255,255,255,0.3)";
                ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, 3);
                ctx.fillRect(x * cellSize + 1, y * cellSize + 1, 3, cellSize - 2);
                
                // 3D effect - shadow
                ctx.fillStyle = "rgba(0,0,0,0.3)";
                ctx.fillRect(x * cellSize + 1, y * cellSize + cellSize - 4, cellSize - 2, 3);
                ctx.fillRect(x * cellSize + cellSize - 4, y * cellSize + 1, 3, cellSize - 2);
            }
        }
    }

    // Side panel - Next piece
    const sideX = boardW + cellSize;
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(sideX, 10, cellSize * 5, cellSize * 5);
    
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px monospace";
    ctx.fillText("NEXT", sideX + 10, 30);

    // Draw next piece
    const nextColor = TETRIS_COLORS[scene.nextPiece.color];
    scene.nextPiece.cells.forEach(([dx, dy]) => {
        const nx = sideX + cellSize + dx * (cellSize * 0.8);
        const ny = 50 + dy * (cellSize * 0.8);
        ctx.fillStyle = nextColor;
        ctx.fillRect(nx, ny, cellSize * 0.8 - 2, cellSize * 0.8 - 2);
    });

    // Stats
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px monospace";
    ctx.fillText(`SCORE`, sideX + 10, cellSize * 6);
    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 20px monospace";
    ctx.fillText(`${scene.score}`, sideX + 10, cellSize * 6 + 25);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px monospace";
    ctx.fillText(`LINES`, sideX + 10, cellSize * 8);
    ctx.fillStyle = "#f97316";
    ctx.font = "bold 20px monospace";
    ctx.fillText(`${scene.lines}`, sideX + 10, cellSize * 8 + 25);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px monospace";
    ctx.fillText(`LEVEL`, sideX + 10, cellSize * 10);
    ctx.fillStyle = "#a855f7";
    ctx.font = "bold 20px monospace";
    ctx.fillText(`${scene.level}`, sideX + 10, cellSize * 10 + 25);

    return { width: totalW, height: boardH };
}
