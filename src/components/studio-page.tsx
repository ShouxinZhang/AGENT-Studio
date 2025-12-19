"use client";

import ChatPanel from "@/features/chat/components/chat-panel";
import ConversationList from "@/features/chat/components/conversation-list";
import { StudioProvider } from "@/features/chat/store/studio-store";
import SettingsPanel from "@/features/settings/components/settings-panel";

export default function StudioPage() {
  return (
    <StudioProvider>
      <div className="min-h-screen px-4 py-6 lg:px-8">
        <div className="grid min-h-[calc(100vh-3rem)] gap-4 lg:grid-cols-[260px,1fr,320px]">
          <ConversationList className="order-2 lg:order-1" />
          <ChatPanel className="order-1 lg:order-2" />
          <SettingsPanel className="order-3 lg:order-3" />
        </div>
      </div>
    </StudioProvider>
  );
}
