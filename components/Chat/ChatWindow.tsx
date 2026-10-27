// components/chat/ChatWindow.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  MoreVertical,
  Phone,
  Search,
  Trash2,
  X,
} from "lucide-react";
import MessageBubble from "@/components/Chat/MessageBubble";
import MessageInput from "@/components/Chat/MessageInput";
import { displayName, type Conversation, type Message } from "@/lib/chat";
import { useChat } from "@/lib/chat-context";

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

const CHAT_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cg fill='%23748a9c' fill-opacity='0.14'%3E%3Ccircle cx='20' cy='20' r='2.5'/%3E%3Ccircle cx='70' cy='50' r='2'/%3E%3Ccircle cx='100' cy='20' r='1.8'/%3E%3Ccircle cx='40' cy='80' r='2.5'/%3E%3Ccircle cx='90' cy='90' r='2'/%3E%3Ccircle cx='10' cy='60' r='1.8'/%3E%3Ccircle cx='60' cy='110' r='1.5'/%3E%3C/g%3E%3C/svg%3E\")";

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
  const { deleteConversation } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [searchOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setSearchQuery("");
  }, [activeConversation?.id]);

  const filteredMessages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((m) => m.content.toLowerCase().includes(q));
  }, [messages, searchQuery]);

  const handleDeleteConversation = async () => {
    if (!activeConversation) return;
    const confirmed = window.confirm(
      "Delete this chat? Messages will be removed from your list. If they message you again, the chat will come back."
    );
    if (!confirmed) return;

    setDeleting(true);
    setMenuOpen(false);
    const ok = await deleteConversation(activeConversation.id);
    setDeleting(false);
    if (ok && typeof window !== "undefined" && window.innerWidth < 768) {
      onBack();
    }
  };

  if (!activeConversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-slate-50 text-slate-400 dark:bg-[#0e1621] dark:text-slate-500">
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
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-slate-100 dark:bg-[#0e1621]">
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
            type="button"
            onClick={() => {
              setSearchOpen((v) => !v);
              setTimeout(() => searchInputRef.current?.focus(), 50);
            }}
            className={`rounded-full p-2 transition ${
              searchOpen
                ? "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300"
                : "hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            aria-label="Search in chat"
          >
            <Search size={20} />
          </button>

          <button
            className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Call"
            title="Voice call (coming soon)"
          >
            <Phone size={20} />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="More options"
            >
              <MoreVertical size={20} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => void handleDeleteConversation()}
                  disabled={deleting}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/40"
                >
                  <Trash2 size={16} />
                  {deleting ? "Deleting..." : "Delete chat"}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* SEARCH BAR */}
      {searchOpen && (
        <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
          <Search size={16} className="text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in this chat..."
            className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
          />
          {searchQuery && (
            <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
              {filteredMessages.length} result
              {filteredMessages.length !== 1 ? "s" : ""}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setSearchOpen(false);
              setSearchQuery("");
            }}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Close search"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* MESSAGE AREA — dark mode کاملاً پشتیبانی می‌شود */}
      <div
        className="scrollbar-hidden relative flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-slate-100 p-3 dark:bg-[#0e1621] sm:p-6"
        style={{
          backgroundImage: CHAT_PATTERN,
          backgroundSize: "120px 120px",
        }}
      >
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

        {!loadingMessages &&
          messages.length > 0 &&
          searchQuery.trim() &&
          filteredMessages.length === 0 && (
            <div className="m-auto rounded-xl bg-white/80 p-4 text-center text-sm text-slate-500 shadow-sm backdrop-blur-sm dark:bg-slate-800/80 dark:text-slate-400">
              No messages match &quot;{searchQuery}&quot;.
            </div>
          )}

        {filteredMessages.map((message) => (
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