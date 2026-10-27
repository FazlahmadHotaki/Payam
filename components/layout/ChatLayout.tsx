// components/layout/ChatLayout.tsx
"use client";

import { useState } from "react";
import { LoaderCircle, MessageCircle } from "lucide-react";
import { useChat } from "@/lib/chat-context";
import ChatWindow from "@/components/Chat/ChatWindow";

export default function ChatLayout() {
  const {
    loading,
    error,
    setError,
    activeConversation,
    messages,
    userId,
    loadingMessages,
    sending,
    sendMessage,
    clearActive,
  } = useChat();

  const [draft, setDraft] = useState("");

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        <LoaderCircle className="mr-2 animate-spin" size={20} />
        Connecting to Payam...
      </div>
    );
  }

  return (
    /* min-h-0 and overflow-hidden here */
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-white dark:bg-slate-900">
      {error && (
        <div className="flex shrink-0 items-start justify-between border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          <p>{error}</p>
          <button onClick={() => setError("")} className="font-semibold underline">
            Dismiss
          </button>
        </div>
      )}

      {activeConversation ? (
        <ChatWindow
          activeConversation={activeConversation}
          messages={messages}
          userId={userId}
          loadingMessages={loadingMessages}
          draft={draft}
          sending={sending}
          onDraftChange={setDraft}
          onSend={async (e) => {
            e.preventDefault();
            const ok = await sendMessage(draft);
            if (ok) setDraft("");
          }}
          onBack={clearActive}
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center bg-slate-50 text-slate-400 dark:bg-[#0e1621]">
          <div className="rounded-full bg-slate-200 p-6 dark:bg-slate-800">
            <MessageCircle size={48} className="opacity-40" />
          </div>
          <p className="mt-4 text-sm">Select a chat to start messaging</p>
        </div>
      )}
    </div>
  );
}