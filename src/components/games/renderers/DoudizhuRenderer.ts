/**
 * Doudizhu Renderer - 斗地主渲染器
 */

import { DoudizhuScene } from '../types';

const COLORS = {
    RED: '#ef4444',
    BLACK: '#1e293b',
    BG: '#35654d', // Poker table green
    CARD_BG: '#f8fafc',
    HIGHLIGHT: '#fbbf24',
    LANDLORD: '#f59e0b',
    PEASANT: '#94a3b8'
};

function clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, n));
}

type HandLayout = {
    cardW: number;
    cardH: number;
    spacing: number;
    rows: number;
    cardsPerRow: number;
    rowGap: number;
};

function computeHandLayout(count: number, maxW: number, maxH: number): HandLayout {
    // Base sizes tuned for readability; we adapt down if space is tight.
    const baseW = 40;
    const baseH = 56;

    const rows = count > 14 ? 2 : 1;
    const cardsPerRow = rows === 2 ? Math.ceil(count / 2) : count;

    const maxCardW = baseW;
    const minCardW = 22;
    const availableW = Math.max(120, maxW);

    // Choose spacing first, then derive card width.
    const maxSpacing = 16;
    const minSpacing = 6;
    const spacingForMaxCard = cardsPerRow <= 1
        ? maxSpacing
        : (availableW - maxCardW) / (cardsPerRow - 1);
    const spacing = clamp(spacingForMaxCard, minSpacing, maxSpacing);

    const cardW = clamp(availableW - spacing * (cardsPerRow - 1), minCardW, maxCardW);
    const cardH = clamp(cardW * (baseH / baseW), 30, baseH);

    // Keep within height; if tight, reduce gap.
    const minRowGap = 4;
    const desiredRowGap = 8;
    const neededH = rows * cardH + (rows - 1) * desiredRowGap;
    const rowGap = neededH > maxH ? minRowGap : desiredRowGap;

    return { cardW, cardH, spacing, rows, cardsPerRow, rowGap };
}

function drawCard(
    ctx: CanvasRenderingContext2D, 
    val: string, 
    x: number, 
    y: number, 
    w: number, 
    h: number,
    highlight: boolean = false,
    isLaizi: boolean = false
) {
    // Shadow
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    
    // Card Body
    ctx.fillStyle = COLORS.CARD_BG;
    if (isLaizi) ctx.fillStyle = '#fef3c7'; // yellowish for laizi
    
    // Rounded rect
    const r = 4;
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
    ctx.fill();

    if (highlight) {
        ctx.strokeStyle = COLORS.HIGHLIGHT;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    ctx.shadowBlur = 0;

    const isJoker = val === 'rj' || val === 'bj';
    const displayVal = isJoker ? (val === 'rj' ? 'RJ' : 'BJ') : val.toUpperCase();

    // Corner text (keeps readable even with overlap)
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = `bold ${Math.max(10, Math.floor(w * 0.28))}px sans-serif`;
    ctx.fillStyle = isJoker ? (val === 'rj' ? COLORS.RED : COLORS.BLACK) : COLORS.BLACK;
    ctx.fillText(displayVal, x + 6, y + 6);

    // Center text (smaller to reduce overlap issues)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.max(12, Math.floor(w * 0.42))}px sans-serif`;
    ctx.fillStyle = isJoker ? (val === 'rj' ? COLORS.RED : COLORS.BLACK) : COLORS.BLACK;
    ctx.fillText(displayVal, x + w / 2, y + h / 2 + 2);
    
    if (isLaizi) {
        ctx.font = `10px sans-serif`;
        ctx.fillStyle = '#d97706';
        ctx.fillText("癞", x + w - 8, y + 10);
    }
}

export function renderDoudizhu(
    ctx: CanvasRenderingContext2D,
    scene: DoudizhuScene,
    containerW: number = 600,
    containerH: number = 400
): { width: number; height: number } {
    
    // Background
    const gradient = ctx.createRadialGradient(containerW/2, containerH/2, 50, containerW/2, containerH/2, containerW);
    gradient.addColorStop(0, "#059669");
    gradient.addColorStop(1, "#064e3b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, containerW, containerH);

    // Layout Constants (base; hands are adaptive)
    const BASE_CARD_W = 40;
    const BASE_CARD_H = 56;
    const BASE_SPACING = 15;
    
    // Draw Hole Cards (Top Center)
    const holeStartX = containerW/2 - (3*BASE_CARD_W + 2*5)/2;
    const holeY = 20;
    
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.roundRect(holeStartX - 5, holeY - 5, (3*BASE_CARD_W + 2*5) + 10, BASE_CARD_H + 10, 5);
    ctx.fill();
    
    scene.holeCards.forEach((c, i) => {
        drawCard(ctx, c, holeStartX + i*(BASE_CARD_W+5), holeY, BASE_CARD_W, BASE_CARD_H, false, scene.laizi.includes(c));
    });

    if (scene.laizi.length > 0) {
        // More visible label
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.roundRect(containerW / 2 - 120, holeY + BASE_CARD_H + 6, 240, 24, 8);
        ctx.fill();
        ctx.fillStyle = "#fbbf24";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`LAI ZI: ${scene.laizi.join(",")}`, containerW / 2, holeY + BASE_CARD_H + 18);
    }

    // Draw Players
    // 0: Left, 1: Right, 2: Bottom (Self/Agent) ? 
    // Wait, typical view is My Agent at bottom. Agent ID depends on session.
    // The scene returns list of players with `id`.
    // Let's assume Player 0 is left, 1 is Right, 2 is Bottom for fixed viz?
    // Or rotate so `isTurn` player is highlighted?
    // Let's just hardcode positions for ID 0, 1, 2 for now, or relative to "my perspective"
    // Since backend returns `players` array size 3.
    // We place them:
    // P0: Left, P1: Right, P2: Bottom (if we just iterate).
    // Actually typically: P0 (Landlord?) -> P1 -> P2 -> P0
    // Let's optimize for showing all hands (God Mode).
    
    const POSITIONS = [
        { x: 80, y: containerH/2, align: 'left', name: "Player 0" }, // Left
        { x: containerW - 80, y: containerH/2, align: 'right', name: "Player 1" }, // Right
        { x: containerW/2, y: containerH - 80, align: 'bottom', name: "Player 2" }  // Bottom
    ];

    scene.players.forEach((p) => {
        const pos = POSITIONS[p.id]; // Map ID to position
        const isLandlord = p.role === 'landlord';
        
        // Avatar / Info
        ctx.fillStyle = isLandlord ? COLORS.LANDLORD : COLORS.PEASANT;
        ctx.beginPath();
        const avX = pos.align === 'left' ? pos.x - 40 : (pos.align === 'right' ? pos.x + 40 : pos.x);
        const avY = pos.align === 'bottom' ? pos.y + 50 : pos.y;
        ctx.arc(avX, avY, 20, 0, Math.PI*2);
        ctx.fill();
        
        if (p.isTurn) {
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Turn indicator text
            ctx.fillStyle = "#fff";
            ctx.font = "12px sans-serif";
            ctx.fillText("THINKING...", avX, avY + 35);
        }
        
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(isLandlord ? "Landlord" : "Peasant", avX, avY - 25);
        ctx.fillText(`ID: ${p.id}`, avX, avY + 5);

        // Cards (adaptive layout)
        const handSize = p.hand.length;

        // Allocate per-player region
        const regionMaxW = pos.align === 'bottom'
            ? Math.min(containerW - 200, 760)
            : Math.min(containerW / 2 - 140, 360);
        const regionMaxH = pos.align === 'bottom' ? 140 : 120;

        const layout = computeHandLayout(handSize, regionMaxW, regionMaxH);
        const perRow = layout.rows === 2 ? layout.cardsPerRow : handSize;
        const totalRowW = perRow <= 0 ? 0 : (perRow - 1) * layout.spacing + layout.cardW;
        const totalH = layout.rows * layout.cardH + (layout.rows - 1) * layout.rowGap;

        let startX = 0;
        let startY = 0;
        if (pos.align === 'bottom') {
            startX = pos.x - totalRowW / 2;
            startY = pos.y - totalH / 2;
        } else if (pos.align === 'left') {
            startX = pos.x + 20;
            startY = pos.y - totalH / 2;
        } else {
            startX = pos.x - 20 - totalRowW;
            startY = pos.y - totalH / 2;
        }

        // Draw Hand (wrap into 2 rows if needed)
        p.hand.forEach((c, idx) => {
            const row = layout.rows === 2 ? (idx < layout.cardsPerRow ? 0 : 1) : 0;
            const col = layout.rows === 2
                ? (row === 0 ? idx : idx - layout.cardsPerRow)
                : idx;
            const cx = startX + col * layout.spacing;
            const cy = startY + row * (layout.cardH + layout.rowGap);
            drawCard(ctx, c, cx, cy, layout.cardW, layout.cardH, false, scene.laizi.includes(c));
        });
        
        // Draw Last Move (if this player made it)
        if (scene.lastMove.player === p.id && scene.lastMove.cards.length > 0) {
            // Show played cards in center area floating towards them
            const moveSize = scene.lastMove.cards.length;
            const moveW = (moveSize - 1) * BASE_SPACING + BASE_CARD_W;
            
            let mx = 0, my = 0;
            if (pos.align === 'bottom') { mx = pos.x - moveW/2; my = pos.y - 100; }
            else if (pos.align === 'left') { mx = pos.x + 150; my = pos.y - BASE_CARD_H/2; }
            else { mx = pos.x - 150 - moveW; my = pos.y - BASE_CARD_H/2; }
            
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            ctx.roundRect(mx-5, my-5, moveW+10, BASE_CARD_H+10, 5);
            ctx.fill();
            
            scene.lastMove.cards.forEach((c, idx) => {
                drawCard(ctx, c, mx + idx*BASE_SPACING, my, BASE_CARD_W, BASE_CARD_H, true, scene.laizi.includes(c));
            });
            
            // Move Type Text
            ctx.fillStyle = "#fbbf24";
            ctx.font = "bold 12px sans-serif";
            ctx.fillText(scene.lastMove.type, mx + moveW/2, my - 15);
        }
    });

    // Winner Overlay
    if (scene.winner !== -1) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, containerW, containerH);
        
        ctx.fillStyle = "#fbbf24";
        ctx.font = "bold 48px sans-serif";
        ctx.textAlign = "center";
        
        const winnerRole = scene.players[scene.winner].role;
        ctx.fillText(`${winnerRole.toUpperCase()} WINS!`, containerW/2, containerH/2);
        
        ctx.font = "24px sans-serif";
        ctx.fillStyle = "#fff";
        ctx.fillText(`Player ${scene.winner} delivered the final blow`, containerW/2, containerH/2 + 40);
    }

    return { width: containerW, height: containerH };
}
