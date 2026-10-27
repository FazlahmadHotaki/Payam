// components/chat/ChatWindow.tsx
"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft, MoreVertical, Phone, Search } from "lucide-react";
import MessageBubble from "@/components/Chat/MessageBubble";
import MessageInput from "@/components/Chat/MessageInput";
import { displayName, type Conversation, type Message } from "@/lib/chat";

type Props = {
  activeConversation: Conversation | null;
  messages: Message[];
  userId: string;
  loadingMessages: boolean;
  draft: string;
  sending: boolean;
  onDraftChange: (value: string) => void;
  onSend: (event: React.FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
};

export default function ChatWindow({
  activeConversation,
  messages,
  userId,
  loadingMessages,
  draft,
  sending,
  onDraftChange,
  onSend,
  onBack,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!activeConversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-slate-50 text-slate-400 dark:bg-slate-900/50">
        <div className="rounded-full bg-slate-200 p-6 dark:bg-slate-800">
          <Search size={48} className="opacity-40" />
        </div>
        <p className="mt-4 text-sm">Select a chat to start messaging</p>
      </div>
    );
  }

  const name = displayName(activeConversation.otherUser);
  const initial = name.charAt(0).toUpperCase();
  const username = activeConversation.otherUser.username;
  const avatarUrl = activeConversation.otherUser.avatar_url;

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#e6ebee] dark:bg-[#0e1621]">
      {/* HEADER */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-2 dark:border-slate-800 dark:bg-slate-900 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>

          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={name}
              className="size-9 shrink-0 rounded-full object-cover sm:size-10"
            />
          ) : (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white sm:size-10">
              {initial}
            </div>
          )}

          <div className="flex min-w-0 flex-col">
            <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100 sm:text-base">
              {name}
            </h2>
            <p className="truncate text-xs text-blue-500 dark:text-blue-400">
              @{username || "username"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 text-slate-500 dark:text-slate-400 sm:gap-2">
          <button
            className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Search in chat"
          >
            <Search size={20} />
          </button>
          <button
            className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Call"
          >
            <Phone size={20} />
          </button>
          <button
            className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="More options"
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </header>

      {/* MESSAGE AREA */}
      <div className="telegram-pattern scrollbar-hidden flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3 sm:p-6">
        {loadingMessages && (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Loading messages...
          </p>
        )}

        {!loadingMessages && messages.length === 0 && (
          <div className="m-auto flex flex-col items-center rounded-xl bg-white/80 p-4 text-center shadow-sm backdrop-blur-sm dark:bg-slate-800/80">
            <p className="font-medium text-slate-700 dark:text-slate-300">
              No messages here yet...
            </p>
            <p className="text-sm text-slate-500">
              Send a message to start the conversation!
            </p>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            mine={message.sender_id === userId}
          />
        ))}

        <div ref={bottomRef} className="h-2" />
      </div>

      {/* INPUT */}
      <div className="shrink-0">
        <MessageInput
          value={draft}
          onChange={onDraftChange}
          onSubmit={onSend}
          sending={sending}
        />
      </div>
    </div>
  );
}