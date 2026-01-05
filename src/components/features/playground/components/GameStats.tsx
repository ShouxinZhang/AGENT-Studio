import { GameScene, TetrisScene } from '@/components/games/types';

interface GameStatsProps {
    scene: GameScene | null;
    steps: number;
}

export function GameStats({ scene, steps }: GameStatsProps) {
    const getScore = () => {
        if (scene && 'score' in scene) return scene.score;
        return 0;
    };

    const getLines = () => {
        if (scene && 'lines' in scene) return (scene as TetrisScene).lines;
        return null;
    };

    const getLevel = () => {
        if (scene && 'level' in scene) return (scene as TetrisScene).level;
        return null;
    };

    const lines = getLines();
    const level = getLevel();

    return (
        <div className="flex items-center gap-6 mb-4">
            <StatItem label="SCORE" value={getScore()} color="text-cyan-400" />
            {lines !== null && <StatItem label="LINES" value={lines} color="text-purple-400" />}
            {level !== null && <StatItem label="LEVEL" value={level} color="text-pink-400" />}
            <StatItem label="STEPS" value={steps} color="text-gray-400" size="sm" />
        </div>
    );
}

function StatItem({ label, value, color, size = 'default' }: { label: string; value: number; color: string; size?: 'default' | 'sm' }) {
    return (
        <div className="text-center">
            <div className={`font-bold font-mono ${color} ${size === 'sm' ? 'text-xl' : 'text-3xl'}`}>
                {value.toLocaleString()}
            </div>
            <div className={`text-gray-500 uppercase tracking-wider ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}>
                {label}
            </div>
        </div>
    );
}
