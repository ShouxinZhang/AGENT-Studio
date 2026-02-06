import type { GameApi, GameId } from "../games/types";
import type { McpToolRequest } from "./types";
import { suggestTetrisAction, type TetrisState } from "../games/tetris/tetrisCore";

export type GameToolSpec = {
    tool: string;
    description: string;
    argsExample: Record<string, unknown>;
};

const COMMON_SPECS: GameToolSpec[] = [
    { tool: "game.get_state", description: "returns current game state JSON", argsExample: {} },
    { tool: "game.get_actions", description: "returns allowed actions", argsExample: {} },
    { tool: "game.step", description: "applies one step and returns next state", argsExample: { action: "none" } },
    { tool: "game.reset", description: "resets game and returns state", argsExample: {} },
];

const TETRIS_SPECS: GameToolSpec[] = [
    { tool: "tetris.get_state", description: "returns full Tetris state", argsExample: {} },
    { tool: "tetris.get_actions", description: "returns allowed Tetris actions", argsExample: {} },
    { tool: "tetris.step", description: "applies one Tetris action and returns next state", argsExample: { action: "none" } },
    { tool: "tetris.reset", description: "resets Tetris and returns state", argsExample: {} },
    { tool: "tetris.get_score", description: "returns score, lines, steps, gameOver summary", argsExample: {} },
    { tool: "tetris.suggest_action", description: "returns a heuristic next action to improve score", argsExample: {} },
    { tool: "tetris.auto_step", description: "applies suggested actions repeatedly and returns updated state", argsExample: { repeat: 3 } },
];

function normalizeTool(tool: string): string {
    return tool.trim().toLowerCase();
}

export function getGameToolSpecs(gameId: GameId): GameToolSpec[] {
    if (gameId === "Tetris") {
        return [...COMMON_SPECS, ...TETRIS_SPECS];
    }
    return COMMON_SPECS;
}

function getTetrisScoreSnapshot(api: GameApi) {
    const state = api.getState() as Record<string, unknown>;
    return {
        score: typeof state.score === "number" ? state.score : 0,
        lines: typeof state.lines === "number" ? state.lines : 0,
        steps: typeof state.steps === "number" ? state.steps : 0,
        gameOver: Boolean(state.gameOver),
    };
}

export async function callGameTool(req: McpToolRequest, api: GameApi): Promise<unknown> {
    const tool = normalizeTool(req.tool);
    const args = req.args ?? {};

    if (tool === "game.get_state" || tool === "tetris.get_state") return api.getState();
    if (tool === "game.get_actions" || tool === "tetris.get_actions") return api.getActions();

    if (tool === "game.reset" || tool === "tetris.reset") {
        api.reset();
        return api.getState();
    }

    if (tool === "game.step" || tool === "tetris.step") {
        const action = typeof args.action === "string" ? args.action : "none";
        api.step(action);
        return api.getState();
    }

    if (tool === "tetris.get_score") {
        if (api.gameId !== "Tetris") {
            throw new Error("tool_not_available_for_game:tetris.get_score");
        }
        return getTetrisScoreSnapshot(api);
    }

    if (tool === "tetris.suggest_action") {
        if (api.gameId !== "Tetris") {
            throw new Error("tool_not_available_for_game:tetris.suggest_action");
        }
        const state = api.getState() as TetrisState;
        return suggestTetrisAction(state);
    }

    if (tool === "tetris.auto_step") {
        if (api.gameId !== "Tetris") {
            throw new Error("tool_not_available_for_game:tetris.auto_step");
        }
        const rawRepeat = typeof args.repeat === "number" ? args.repeat : Number(args.repeat ?? 3);
        const repeat = Number.isFinite(rawRepeat)
            ? Math.max(1, Math.min(8, Math.floor(rawRepeat)))
            : 3;

        const appliedActions: string[] = [];
        for (let i = 0; i < repeat; i++) {
            const state = api.getState() as TetrisState;
            if (state.gameOver) break;
            const suggestion = suggestTetrisAction(state);
            api.step(suggestion.action);
            appliedActions.push(suggestion.action);
        }

        const state = api.getState() as TetrisState;
        return {
            appliedActions,
            repeat,
            state,
            score: typeof state.score === "number" ? state.score : 0,
            lines: typeof state.lines === "number" ? state.lines : 0,
            gameOver: Boolean(state.gameOver),
        };
    }

    throw new Error(`unknown_tool:${req.tool}`);
}
