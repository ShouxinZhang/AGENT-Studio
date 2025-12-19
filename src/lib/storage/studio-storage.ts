import type { StudioState } from "@/features/chat/store/types";

const STORAGE_KEY = "agent-studio:state:v1";

export function readStudioState(): StudioState | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as StudioState;
  } catch {
    return null;
  }
}

export function writeStudioState(state: StudioState) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore write failures (private mode, quota, etc).
  }
}
