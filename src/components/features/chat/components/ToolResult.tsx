"use client";

import { cn } from "@/lib/utils";
import { Terminal } from "lucide-react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { memo, useState } from "react";
import ReactMarkdown from "react-markdown";

interface ToolResultProps {
    content: string;
    isError?: boolean;
}

export const ToolResult = memo(function ToolResult({ content, isError }: ToolResultProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="not-prose my-1"
        >
            <CollapsibleTrigger
                className={cn(
                    "flex w-full items-center gap-2 text-xs font-mono transition-colors hover:bg-neutral-800/50 p-1.5 rounded outline-none",
                    isError ? "text-red-400" : "text-muted-foreground"
                )}
            >
                <Terminal className="size-3.5" />
                <span>Tool Result</span>
                <span className="opacity-50 text-[10px] uppercase border border-neutral-700 px-1 rounded">JSON</span>
                <div className="flex-1" />
                <span className="text-[10px] opacity-70">
                    {isOpen ? "Hide" : "Show"}
                </span>
            </CollapsibleTrigger>

            <CollapsibleContent>
                <div className={cn(
                    "mt-1 rounded-md border text-xs font-mono overflow-x-auto p-2 bg-neutral-900/50 animate-in slide-in-from-top-1 fade-in-0",
                    isError ? "border-red-900/30 text-red-200" : "border-border text-foreground"
                )}>
                    <pre className="whitespace-pre-wrap break-all">{content}</pre>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
});
