"use client";

import * as React from "react";
import { Wrench } from "lucide-react";
import { Select } from "@/components/ui/select";
import { usePlaygroundSettingsStore } from "@/lib/store/usePlaygroundSettingsStore";
import { AVAILABLE_MODELS } from "@/lib/config/llm";
import { getGameToolSpecs } from "@/components/features/playground/mcp/gameMcpTools";
import type { GameId } from "@/components/features/playground/games/types";

type Props = {
    gameId: GameId;
};

export function PlaygroundToolsView({ gameId }: Props) {
    const model = usePlaygroundSettingsStore((s) => s.model);
    const setModel = usePlaygroundSettingsStore((s) => s.setModel);

    const tools = React.useMemo(() => getGameToolSpecs(gameId), [gameId]);

    return (
        <div className="flex h-full flex-col bg-background animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="space-y-3 border-b border-border/50 p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Game MCP Tools
                </div>

                <div className="space-y-1">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Agent Model
                    </div>
                    <Select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="h-9 bg-neutral-900/50 border-neutral-800 text-sm"
                    >
                        {AVAILABLE_MODELS.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.name}
                            </option>
                        ))}
                    </Select>
                </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-2">
                {tools.map((tool) => (
                    <div
                        key={tool.tool}
                        className="rounded-lg border border-border/60 bg-neutral-900/30 p-2.5"
                    >
                        <div className="flex items-center gap-2">
                            <Wrench size={12} className="text-primary" />
                            <div className="text-xs font-semibold text-foreground">{tool.tool}</div>
                        </div>
                        <div className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                            {tool.description}
                        </div>
                        <div className="mt-1.5 rounded bg-black/30 px-2 py-1 font-mono text-[10px] text-muted-foreground">
                            args: {JSON.stringify(tool.argsExample)}
                        </div>
                    </div>
                ))}
            </div>

            <div className="border-t border-border/50 bg-neutral-900/20 p-3 text-[10px] italic leading-relaxed text-muted-foreground">
                当前显示的是 {gameId} 本地 MCP 工具，始终可用。
            </div>
        </div>
    );
}
