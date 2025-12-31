import { create } from "zustand";

interface ChatUIState {
    // ===== 编辑状态 =====
    /** 当前正在编辑的消息 ID */
    editingId: string | null;
    /** 当前正在编辑的角色 (用于区分 UI 行为) */
    editingRole: "user" | "assistant" | null;
    /** 编辑框中的实时内容 */
    editingContent: string;
    
    // Actions
    setEditing: (id: string, role: "user" | "assistant", content: string) => void;
    setEditingContent: (content: string) => void;
    cancelEditing: () => void;

    // ===== 复制状态 =====
    /** 当前显示“已复制”状态的消息 ID */
    copiedId: string | null;
    
    // Actions
    copyMessage: (id: string, text: string) => void;
}

export const useChatUIStore = create<ChatUIState>((set) => ({
    editingId: null,
    editingRole: null,
    editingContent: "",

    setEditing: (id, role, content) => 
        set({ editingId: id, editingRole: role, editingContent: content }),
        
    setEditingContent: (content) => 
        set({ editingContent: content }),
        
    cancelEditing: () => 
        set({ editingId: null, editingRole: null, editingContent: "" }),

    copiedId: null,
    
    copyMessage: (id, text) => {
        if (typeof navigator !== "undefined") {
            navigator.clipboard.writeText(text);
            set({ copiedId: id });
            setTimeout(() => set({ copiedId: null }), 2000);
        }
    },
}));
