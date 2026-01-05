"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: undefined,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            const details =
                process.env.NODE_ENV !== "production" && this.state.error
                    ? ` (${this.state.error.message})`
                    : "";

            return (
                <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/20">
                    Something went wrong rendering this content{details}.
                </div>
            );
        }

        return this.props.children;
    }
}
