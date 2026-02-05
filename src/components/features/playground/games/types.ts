export type GameId = "Snake" | "Tetris" | "Sokoban";

export type GameApi = {
    gameId: GameId;
    reset: () => void;
    getState: () => unknown;
    getActions: () => string[];
    step: (action: string) => void;
};
