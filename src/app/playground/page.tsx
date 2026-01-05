"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare, Zap, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CATEGORIES, getGamesByCategory, type GameConfig } from "@/lib/games/registry";

const BACKEND_URL = "http://localhost:8000";

export default function PlaygroundPage() {
    const router = useRouter();
    const [isConnected, setIsConnected] = useState(false);

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

    const arcadeGames = getGamesByCategory("arcade");
    const rlGames = getGamesByCategory("rl-classic");

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900 text-white overflow-auto">
            {/* Background Grid */}
            <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzMzMzM2NiIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30 pointer-events-none" />
            
            {/* Neon Side Bars */}
            <div className="fixed left-0 top-0 h-full w-2 bg-gradient-to-b from-pink-500 via-purple-500 to-cyan-500 opacity-75 blur-sm" />
            <div className="fixed right-0 top-0 h-full w-2 bg-gradient-to-b from-cyan-500 via-purple-500 to-pink-500 opacity-75 blur-sm" />
            
            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-white/10">
                <Link 
                    href="/" 
                    className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                    <MessageSquare size={18} />
                    <span>Back to Chat</span>
                </Link>
                
                <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                    <span className="text-xs text-gray-400">
                        {isConnected ? "Backend Online" : "Backend Offline"}
                    </span>
                </div>
            </header>

            {/* Title */}
            <div className="relative z-10 text-center py-8">
                <h1 className="text-5xl md:text-7xl font-bold tracking-wider">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-400 drop-shadow-[0_0_30px_rgba(236,72,153,0.5)]">
                        AI GAME ARCADE
                    </span>
                </h1>
                <p className="mt-4 text-gray-400 text-lg">Select a game to train your Agent</p>
                
                <div className="mt-6 flex items-center justify-center gap-4">
                    <div className="h-px w-32 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
                    <Zap className="text-yellow-400" size={24} />
                    <div className="h-px w-32 bg-gradient-to-r from-transparent via-pink-500 to-transparent" />
                </div>
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-8 pb-16">
                {/* Arcade Games Section */}
                <GameSection 
                    title={CATEGORIES.arcade.name}
                    icon={CATEGORIES.arcade.icon}
                    description={CATEGORIES.arcade.description}
                    games={arcadeGames}
                    isConnected={isConnected}
                    onPlay={(id) => router.push(`/playground/${id}`)}
                />

                {/* RL Classic Section */}
                <GameSection 
                    title={CATEGORIES["rl-classic"].name}
                    icon={CATEGORIES["rl-classic"].icon}
                    description={CATEGORIES["rl-classic"].description}
                    games={rlGames}
                    isConnected={isConnected}
                    onPlay={(id) => router.push(`/playground/${id}`)}
                    collapsible
                    defaultCollapsed={false}
                />
            </div>
        </div>
    );
}

interface GameSectionProps {
    title: string;
    icon: string;
    description: string;
    games: GameConfig[];
    isConnected: boolean;
    onPlay: (id: string) => void;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
}

function GameSection({ title, icon, description, games, isConnected, onPlay, collapsible, defaultCollapsed }: GameSectionProps) {
    const [collapsed, setCollapsed] = useState(defaultCollapsed ?? false);

    return (
        <div className="mb-12">
            {/* Section Header */}
            <div 
                className={`flex items-center gap-4 mb-6 ${collapsible ? 'cursor-pointer' : ''}`}
                onClick={() => collapsible && setCollapsed(!collapsed)}
            >
                <span className="text-3xl">{icon}</span>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white">{title}</h2>
                    <p className="text-sm text-gray-500">{description}</p>
                </div>
                {collapsible && (
                    <ChevronRight 
                        className={`text-gray-500 transition-transform ${collapsed ? '' : 'rotate-90'}`} 
                        size={24} 
                    />
                )}
                <div className="text-xs text-gray-600 bg-gray-800 px-3 py-1 rounded-full">
                    {games.filter(g => g.available).length}/{games.length} available
                </div>
            </div>

            {/* Game Grid */}
            {!collapsed && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {games.map((game) => (
                        <GameCard 
                            key={game.id} 
                            game={game} 
                            isConnected={isConnected}
                            onSelect={() => game.available && isConnected && onPlay(game.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

interface GameCardProps {
    game: GameConfig;
    isConnected: boolean;
    onSelect: () => void;
}

function GameCard({ game, isConnected, onSelect }: GameCardProps) {
    const canPlay = game.available && isConnected;
    
    return (
        <div 
            className={`
                relative group cursor-pointer transition-all duration-300
                ${canPlay ? 'hover:scale-105 hover:-translate-y-1' : 'opacity-50 cursor-not-allowed'}
            `}
            onClick={() => canPlay && onSelect()}
        >
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${game.color} rounded-lg blur opacity-0 group-hover:opacity-75 transition duration-500`} />
            
            <div className={`
                relative bg-gray-900/90 rounded-lg border ${game.borderColor} 
                p-3 flex flex-col items-center
                ${game.shadowColor} shadow-md
            `}>
                <div className="w-full aspect-square bg-black/50 rounded flex items-center justify-center mb-2 overflow-hidden border border-white/5">
                    <span className="text-4xl">{game.emoji}</span>
                </div>
                
                <h3 className={`text-xs font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r ${game.color}`}>
                    {game.name}
                </h3>
                
                <p className="text-[10px] text-gray-500 mt-0.5">{game.description}</p>
                
                <Button 
                    size="sm"
                    className={`
                        mt-2 w-full h-7 text-xs bg-gradient-to-r ${game.color} text-white font-bold
                        hover:opacity-90 transition-opacity
                        ${!canPlay && 'opacity-50'}
                    `}
                    disabled={!canPlay}
                >
                    {!game.available ? "SOON" : !isConnected ? "OFFLINE" : "PLAY"}
                </Button>
                
                {!game.available && (
                    <div className="absolute top-1 right-1 bg-yellow-500/20 text-yellow-400 text-[8px] px-1.5 py-0.5 rounded-full border border-yellow-500/50">
                        Soon
                    </div>
                )}
            </div>
        </div>
    );
}
