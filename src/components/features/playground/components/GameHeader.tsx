import Link from 'next/link';
import { Home } from 'lucide-react';

interface GameHeaderProps {
    title: string;
    emoji?: string;
    isConnected: boolean;
}

export function GameHeader({ title, emoji, isConnected }: GameHeaderProps) {
    return (
        <header className="flex items-center justify-between px-6 py-3 bg-black/40 border-b border-white/5">
            <Link 
                href="/playground" 
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
                <Home size={16} />
                <span className="hidden sm:inline">Arcade</span>
            </Link>
            
            <div className="flex items-center gap-3">
                <span className="text-2xl">{emoji}</span>
                <h1 className="text-lg font-bold tracking-wider">{title}</h1>
            </div>
            
            <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-red-500"}`} />
            </div>
        </header>
    );
}
