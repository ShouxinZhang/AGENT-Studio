export type RenderPayload =
    | { mode: "frame"; frame?: string | null }
    | { mode: "scene"; scene: unknown };

export type BackendState = {
    observation?: unknown;
    reward?: number;
    done?: boolean;
    truncated?: boolean;
    info?: unknown;
    frame?: string | null;
    render?: RenderPayload;
};

export type StartResponse = {
    session_id: string;
    state: BackendState;
};

export type StepResponse = BackendState;
