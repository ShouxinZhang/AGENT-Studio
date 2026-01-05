/**
 * Snake Renderer - Snake 游戏渲染器
 */

import { SnakeScene } from '../types';

export function renderSnake(
    ctx: CanvasRenderingContext2D,
    scene: SnakeScene,
    containerW: number = 600,
    containerH: number = 400
): { width: number; height: number } {
    const cell = Math.min(containerW / scene.grid.w, containerH / scene.grid.h);
    const w = scene.grid.w * cell;
    const h = scene.grid.h * cell;

    // Background
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, "#0f172a");
    gradient.addColorStop(1, "#1e1b4b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= scene.grid.w; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cell, 0);
        ctx.lineTo(x * cell, h);
        ctx.stroke();
    }
    for (let y = 0; y <= scene.grid.h; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cell);
        ctx.lineTo(w, y * cell);
        ctx.stroke();
    }

    // Food (Glowing)
    const fx = scene.food[0] * cell + cell / 2;
    const fy = scene.food[1] * cell + cell / 2;
    const fr = cell / 2 - 2;
    
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ff0055";
    ctx.fillStyle = "#ff0055";
    ctx.beginPath();
    ctx.arc(fx, fy, fr, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner highlight
    ctx.fillStyle = "#ff99bb";
    ctx.beginPath();
    ctx.arc(fx - cell/6, fy - cell/6, fr / 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;

    // Snake
    scene.snake.forEach((p, idx) => {
        const x = p[0] * cell;
        const y = p[1] * cell;
        const size = cell - 1;
        
        if (idx === 0) {
            // Head
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#00ffff";
            ctx.fillStyle = "#00ffff";
            ctx.fillRect(x + 0.5, y + 0.5, size, size);
            
            // Eyes
            ctx.fillStyle = "#000";
            const eyeSize = cell / 5;
            ctx.fillRect(x + cell/4, y + cell/4, eyeSize, eyeSize);
            ctx.fillRect(x + cell*3/4 - eyeSize, y + cell/4, eyeSize, eyeSize);
            
            ctx.shadowBlur = 0;
        } else {
            // Body - Gradient color based on index
            const hue = (140 + (idx * 5)) % 360;
            ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
            ctx.fillRect(x + 0.5, y + 0.5, size, size);
        }
    });

    return { width: w, height: h };
}
