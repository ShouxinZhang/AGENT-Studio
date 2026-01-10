"use client";

import React, { useRef, useEffect } from 'react';
import { cn } from "@/lib/utils";

import { Stroke, Point } from '../types';

interface GraffitiCanvasProps {
    className?: string;
    strokes: Stroke[];
    onStrokeChange: (strokes: Stroke[]) => void;
    readOnly?: boolean;
    tool?: 'pen' | 'eraser';
    color?: string;
    brushSize?: number;
}

export function GraffitiCanvas({
    className,
    strokes,
    onStrokeChange,
    readOnly = false,
    tool = 'pen',
    color = '#FF0055',
    brushSize = 3
}: GraffitiCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDrawing = useRef(false);
    const currentStroke = useRef<Point[]>([]);

    const redraw = (currentStrokes: Stroke[]) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Style for lines
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        currentStrokes.forEach(stroke => {
            if (stroke.points.length === 0) return;

            ctx.beginPath();
            ctx.strokeStyle = stroke.color;
            ctx.fillStyle = stroke.color;
            ctx.lineWidth = stroke.width;

            if (stroke.color === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.fillStyle = 'rgba(0,0,0,1)';
            } else {
                ctx.globalCompositeOperation = 'source-over';
            }

            if (stroke.points.length === 1) {
                // Draw dot
                const p = stroke.points[0];
                ctx.arc(p.x, p.y, stroke.width / 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
                for (let i = 1; i < stroke.points.length; i++) {
                    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
                }
                ctx.stroke();
            }
        });

        // Reset composite op
        ctx.globalCompositeOperation = 'source-over';
    };

    // Resize observer
    useEffect(() => {
        const resizeCanvas = () => {
            if (containerRef.current && canvasRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                canvasRef.current.width = clientWidth;
                canvasRef.current.height = clientHeight;
                redraw(strokes);
            }
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        return () => window.removeEventListener('resize', resizeCanvas);
    }, [strokes]);

    // Redraw on strokes change
    useEffect(() => {
        redraw(strokes);
    }, [strokes]);

    const getPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (readOnly) return;
        isDrawing.current = true;
        const point = getPoint(e);
        currentStroke.current = [point];

        // Draw dot on click
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            if (tool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.fillStyle = 'rgba(0,0,0,1)';
            } else {
                ctx.globalCompositeOperation = 'source-over';
                ctx.fillStyle = color;
            }
            ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing.current || readOnly) return;
        const point = getPoint(e);

        // Realtime draw
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = brushSize;
            if (tool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
            } else {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = color;
            }

            const points = currentStroke.current;
            const lastPoint = points.length > 0 ? points[points.length - 1] : point;

            ctx.beginPath();
            ctx.moveTo(lastPoint.x, lastPoint.y);
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';
        }

        currentStroke.current.push(point);
    };

    const stopDrawing = () => {
        if (!isDrawing.current) return;
        isDrawing.current = false;

        if (currentStroke.current.length > 0) {
            const newStroke: Stroke = {
                points: [...currentStroke.current],
                color: tool === 'eraser' ? 'eraser' : color,
                width: brushSize
            };
            onStrokeChange([...strokes, newStroke]);
        }
        currentStroke.current = [];
    };

    return (
        <div className={cn("relative", className, readOnly ? 'pointer-events-none' : '')} ref={containerRef}>
            <canvas
                ref={canvasRef}
                className={`absolute inset-0 z-10 ${readOnly ? 'pointer-events-none' : 'touch-none cursor-crosshair transition-colors duration-200'}`}
                style={{ background: readOnly ? 'transparent' : 'rgba(0,0,0,0.02)' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
        </div>
    );
}
