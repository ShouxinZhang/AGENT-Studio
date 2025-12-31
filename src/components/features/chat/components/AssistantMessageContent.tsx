"use client";

import type { UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ui/reasoning";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { memo } from "react";
import { motion } from "framer-motion";

// react-markdown expects mutable arrays (Pluggable[])
const REMARK_PLUGINS = [remarkMath];
const REHYPE_PLUGINS = [rehypeKatex];

interface AssistantMessageContentProps {
    /** 消息对象 */
    message: UIMessage;
    /** 是否为最后一条消息 */
    isLastMessage: boolean;
    /** 是否正在流式输出 */
    isStreaming: boolean;
}

export const AssistantMessageContent = memo(function AssistantMessageContent({
    message,
    isLastMessage,
    isStreaming,
}: AssistantMessageContentProps) {
    return (
        <div className="flex flex-col gap-2">
            {message.parts.map((part, i) => {
                if (part.type === "reasoning") {
                    const reasoningText = part.text?.trim();
                    if (!reasoningText) return null;

                    return (
                        <motion.div
                            key={`${message.id}-${i}`}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Reasoning
                                defaultOpen={false}
                                isStreaming={
                                    isStreaming &&
                                    i === message.parts.length - 1 &&
                                    isLastMessage
                                }
                                className="w-full"
                            >
                                <ReasoningTrigger />
                                <ReasoningContent>{reasoningText}</ReasoningContent>
                            </Reasoning>
                        </motion.div>
                    );
                }

                if (part.type === "text") {
                    return (
                        <motion.div
                            key={`${message.id}-${i}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="markdown-body prose prose-invert prose-sm max-w-none"
                        >
                            <ErrorBoundary>
                                <ReactMarkdown
                                    remarkPlugins={REMARK_PLUGINS}
                                    rehypePlugins={REHYPE_PLUGINS}
                                >
                                    {part.text}
                                </ReactMarkdown>
                            </ErrorBoundary>
                        </motion.div>
                    );
                }

                return null;
            })}
        </div>
    );
});
