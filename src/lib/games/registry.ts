/**
 * Game Registry - 游戏注册中心
 * 
 * 统一管理所有游戏的配置、分类和元数据
 * 新增游戏只需在此文件中添加配置即可
 */

export type GameCategory = "arcade" | "rl-classic" | "puzzle" | "strategy";
export type GameRenderMode = "frame" | "scene";

export interface GameConfig {
    id: string;                    // 环境 ID (如 CartPole-v1)
    name: string;                  // 显示名称
    description: string;           // 简短描述
    category: GameCategory;        // 游戏分类
    color: string;                 // 渐变色 (Tailwind)
    borderColor: string;           // 边框色
    shadowColor: string;           // 阴影色
    emoji: string;                 // 图标
    available: boolean;            // 是否可用
    renderMode: GameRenderMode;    // 渲染模式：frame(Python渲染帧) / scene(前端渲染)
    tickMs?: number;               // scene 游戏 tick 间隔（毫秒）
    actions?: {                    // 动作配置 (可选, 用于 Gym 环境)
        count: number;
        labels: string[];
    };
    controls?: {                   // 控制方式说明
        keyboard?: string[];
        description?: string;
    };
}

// =============================================
// 游戏分类定义
// =============================================

export const CATEGORIES: Record<GameCategory, { name: string; description: string; icon: string }> = {
    "arcade": {
        name: "Arcade Games",
        description: "Classic arcade games for AI agents",
        icon: "🕹️"
    },
    "rl-classic": {
        name: "RL Classic",
        description: "OpenAI Gym classic control environments",
        icon: "🎓"
    },
    "puzzle": {
        name: "Puzzle Games",
        description: "Logic and puzzle games",
        icon: "🧩"
    },
    "strategy": {
        name: "Strategy Games",
        description: "Turn-based strategy games",
        icon: "♟️"
    }
};

// =============================================
// 游戏注册表
// =============================================

export const GAMES: GameConfig[] = [
    // ===== Arcade Games (高阶游戏 - 主页展示) =====
    {
        id: "Snake",
        name: "SNAKE",
        description: "Eat & grow!",
        category: "arcade",
        color: "from-lime-400 to-green-500",
        borderColor: "border-lime-400",
        shadowColor: "shadow-lime-500/50",
        emoji: "🐍",
        available: true,
        renderMode: "scene",
        tickMs: 120,
        actions: { count: 4, labels: ["↑ Up", "→ Right", "↓ Down", "← Left"] },
        controls: { keyboard: ["↑", "→", "↓", "←", "W", "A", "S", "D"], description: "Arrow keys / WASD" },
    },
    {
        id: "Tetris",
        name: "TETRIS",
        description: "Stack blocks!",
        category: "arcade",
        color: "from-yellow-400 to-amber-500",
        borderColor: "border-yellow-400",
        shadowColor: "shadow-yellow-500/50",
        emoji: "🧱",
        available: true,
        renderMode: "scene",
        tickMs: 500,
        actions: { count: 6, labels: ["← Left", "Right →", "↻ CW", "↺ CCW", "↓ Soft", "⤓ Hard"] },
        controls: { keyboard: ["←", "→", "↑", "Z", "↓", "Space"], description: "Arrows + Z + Space" },
    },
    {
        id: "Pacman",
        name: "PAC-MAN",
        description: "Eat dots, avoid ghosts!",
        category: "arcade",
        color: "from-yellow-300 to-orange-400",
        borderColor: "border-yellow-300",
        shadowColor: "shadow-yellow-400/50",
        emoji: "👻",
        available: false,
        renderMode: "scene",
    },

    // ===== RL Classic (基础 RL 环境 - 专题展示) =====
    {
        id: "CartPole-v1",
        name: "CART POLE",
        description: "Balance the pole!",
        category: "rl-classic",
        color: "from-cyan-400 to-blue-500",
        borderColor: "border-cyan-400",
        shadowColor: "shadow-cyan-500/50",
        emoji: "🎯",
        available: true,
        renderMode: "frame",
        actions: { count: 2, labels: ["← Left", "Right →"] },
        controls: { keyboard: ["←", "→", "A", "D"] }
    },
    {
        id: "MountainCar-v0",
        name: "MOUNTAIN CAR",
        description: "Reach the flag!",
        category: "rl-classic",
        color: "from-green-400 to-emerald-500",
        borderColor: "border-green-400",
        shadowColor: "shadow-green-500/50",
        emoji: "🚗",
        available: true,
        renderMode: "frame",
        actions: { count: 3, labels: ["← Left", "None", "Right →"] },
        controls: { keyboard: ["←", "→", "A", "D"] }
    },
    {
        id: "Acrobot-v1",
        name: "ACROBOT",
        description: "Swing up high!",
        category: "rl-classic",
        color: "from-purple-400 to-pink-500",
        borderColor: "border-purple-400",
        shadowColor: "shadow-purple-500/50",
        emoji: "🤸",
        available: true,
        renderMode: "frame",
        actions: { count: 3, labels: ["-1 Torque", "0", "+1 Torque"] },
        controls: { keyboard: ["←", "→"] }
    },
    {
        id: "Pendulum-v1",
        name: "PENDULUM",
        description: "Keep it upright!",
        category: "rl-classic",
        color: "from-orange-400 to-red-500",
        borderColor: "border-orange-400",
        shadowColor: "shadow-orange-500/50",
        emoji: "🔄",
        available: true,
        renderMode: "frame",
        actions: { count: 3, labels: ["-2", "0", "+2"] },
        controls: { keyboard: ["←", "→"] }
    },
    {
        id: "LunarLander-v3",
        name: "LUNAR LANDER",
        description: "Land safely!",
        category: "rl-classic",
        color: "from-indigo-400 to-violet-500",
        borderColor: "border-indigo-400",
        shadowColor: "shadow-indigo-500/50",
        emoji: "🚀",
        available: false, // 需要 box2d
        renderMode: "frame",
        actions: { count: 4, labels: ["Noop", "Left", "Main", "Right"] },
    },
    {
        id: "Breakout",
        name: "BREAKOUT",
        description: "Smash bricks!",
        category: "rl-classic",
        color: "from-rose-400 to-pink-500",
        borderColor: "border-rose-400",
        shadowColor: "shadow-rose-500/50",
        emoji: "🎾",
        available: false,
        renderMode: "frame",
    },
    {
        id: "SpaceInvaders",
        name: "SPACE INVADERS",
        description: "Defend Earth!",
        category: "rl-classic",
        color: "from-green-400 to-cyan-500",
        borderColor: "border-green-400",
        shadowColor: "shadow-green-500/50",
        emoji: "👾",
        available: false,
        renderMode: "frame",
    },
    {
        id: "Pong",
        name: "PONG",
        description: "Classic paddle game!",
        category: "rl-classic",
        color: "from-white to-gray-300",
        borderColor: "border-white",
        shadowColor: "shadow-white/30",
        emoji: "🏓",
        available: false,
        renderMode: "frame",
    },

    // ===== Puzzle Games =====
    {
        id: "2048",
        name: "2048",
        description: "Merge tiles!",
        category: "puzzle",
        color: "from-amber-400 to-orange-500",
        borderColor: "border-amber-400",
        shadowColor: "shadow-amber-500/50",
        emoji: "🔢",
        available: false,
        renderMode: "scene",
    },
    {
        id: "Sokoban",
        name: "SOKOBAN",
        description: "Push boxes!",
        category: "puzzle",
        color: "from-amber-600 to-yellow-700",
        borderColor: "border-amber-600",
        shadowColor: "shadow-amber-600/50",
        emoji: "📦",
        available: false,
        renderMode: "scene",
    },

    // ===== Strategy Games =====
    {
        id: "TicTacToe",
        name: "TIC-TAC-TOE",
        description: "Get three in a row!",
        category: "strategy",
        color: "from-blue-400 to-indigo-500",
        borderColor: "border-blue-400",
        shadowColor: "shadow-blue-500/50",
        emoji: "⭕",
        available: false,
        renderMode: "scene",
    },
    {
        id: "Connect4",
        name: "CONNECT 4",
        description: "Connect four!",
        category: "strategy",
        color: "from-red-400 to-yellow-500",
        borderColor: "border-red-400",
        shadowColor: "shadow-red-500/50",
        emoji: "🔴",
        available: false,
        renderMode: "scene",
    },
];

// =============================================
// 辅助函数
// =============================================

/** 获取指定分类的游戏 */
export function getGamesByCategory(category: GameCategory): GameConfig[] {
    return GAMES.filter(g => g.category === category);
}

/** 获取单个游戏配置 */
export function getGameById(id: string): GameConfig | undefined {
    return GAMES.find(g => g.id === id);
}

/** 获取可用游戏 */
export function getAvailableGames(): GameConfig[] {
    return GAMES.filter(g => g.available);
}

/** 获取主页展示的游戏 (Arcade + 部分高亮) */
export function getFeaturedGames(): GameConfig[] {
    return GAMES.filter(g => g.category === "arcade");
}
