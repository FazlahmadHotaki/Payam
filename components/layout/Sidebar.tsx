// components/layout/Sidebar.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Menu,
  Search,
  X,
  Users,
  Settings,
  LogOut,
  UserCircle,
  LoaderCircle,
  ChevronRight,
  Flame,
} from "lucide-react";
import { displayName, relativeTime } from "@/lib/chat";
import { useChat } from "@/lib/chat-context";
import { supabase } from "@/lib/supabase/client";
import type { Profile, Conversation } from "@/lib/chat";
import StoriesBar from "@/components/stories/StoriesBar";
import StoryAvatar from "@/components/stories/StoryAvatar";

export default function Sidebar() {
  const {
    conversations,
    activeConversation,
    myProfile,
    loading,
    openConversation,
    signOut,
    unreadCounts,
    markAsRead,
    setActiveConversation,
  } = useChat();

  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const latestQueryRef = useRef("");

  // Drawer: ESC + body lock
  useEffect(() => {
    if (!menuOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [menuOpen]);

  // Search
  useEffect(() => {
    const q = query.trim();

    if (!q) {
      latestQueryRef.current = "";
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    if (!myProfile?.id) return;

    latestQueryRef.current = q;
    setSearchResults([]);
    setIsSearching(true);

    const delayDebounce = setTimeout(async () => {
      if (latestQueryRef.current !== q) return;

      const escaped = q.replace(/[\\%_]/g, "\\$&");
      const searchTerm = `%${escaped}%`;

      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, email, username, avatar_url")
        .neq("id", myProfile.id)
        .or(
          `display_name.ilike.${searchTerm},username.ilike.${searchTerm},email.ilike.${searchTerm}`
        )
        .limit(20);

      if (latestQueryRef.current !== q) return;

      if (error) {
        console.error("Search failed:", error.message);
        setSearchResults([]);
      } else {
        const lower = q.toLowerCase();
        const filtered = (data ?? []).filter((p) => {
          const haystack = [p.display_name, p.username, p.email]
            .filter((s): s is string => typeof s === "string")
            .map((s) => s.toLowerCase())
            .join(" ");
          return haystack.includes(lower);
        });
        setSearchResults(filtered as Profile[]);
      }

      setIsSearching(false);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query, myProfile?.id]);

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return tb - ta;
    });
  }, [conversations]);

  const totalUnread = useMemo(
    () => Object.values(unreadCounts).reduce((a, b) => a + b, 0),
    [unreadCounts]
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = totalUnread > 0 ? `(${totalUnread}) Payam` : "Payam";
  }, [totalUnread]);

  const handleStartChat = async (profile: Profile) => {
    await openConversation(profile);
    setQuery("");
  };

  const handleSelectConversation = async (c: Conversation) => {
    setActiveConversation(c);
    await markAsRead(c.id);
  };

  return (
    <aside className="relative flex h-full w-full flex-col bg-white dark:bg-slate-900">
      {/* Top Bar */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 px-3 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <Menu size={20} />
        </button>

        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people or @username"
            className="h-9 w-full rounded-full border-0 bg-slate-100 pl-9 pr-8 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-800 dark:focus:bg-slate-700"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {myProfile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={myProfile.avatar_url}
            alt={displayName(myProfile)}
            className="size-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
            {myProfile ? displayName(myProfile).charAt(0).toUpperCase() : "?"}
          </div>
        )}
      </div>

      {/* Stories Bar */}
      <StoriesBar />

      {/* Main List */}
      <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto">
        {query.trim() ? (
          <>
            {isSearching ? (
              <div className="flex justify-center p-4 text-slate-500">
                <LoaderCircle className="animate-spin" size={20} />
              </div>
            ) : searchResults.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-500">
                No users found for &quot;{query}&quot;.
              </p>
            ) : (
              searchResults.map((profile) => (
                <div
                  key={profile.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => void handleStartChat(profile)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      void handleStartChat(profile);
                    }
                  }}
                  className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <StoryAvatar
                    userId={profile.id}
                    avatarUrl={profile.avatar_url}
                    name={displayName(profile)}
                    size={48}
                    ringWidth={2}
                    onClick={() => void handleStartChat(profile)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {displayName(profile)}
                    </p>
                    <p className="truncate text-xs text-blue-500 dark:text-blue-400">
                      @{profile.username || "no_username"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            {loading ? (
              <p className="p-4 text-center text-sm text-slate-500">
                Loading...
              </p>
            ) : sortedConversations.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-500">
                No chats yet.
              </p>
            ) : (
              sortedConversations.map((c) => {
                const active = activeConversation?.id === c.id;
                const unread = unreadCounts[c.id] ?? 0;

                const preview = c.lastMessage
                  ? c.lastMessageSenderId === myProfile?.id
                    ? `You: ${c.lastMessage}`
                    : c.lastMessage
                  : c.otherUser?.username
                  ? `@${c.otherUser.username}`
                  : c.otherUser?.email ?? "";

                return (
                  <div
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => void handleSelectConversation(c)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        void handleSelectConversation(c);
                      }
                    }}
                    className={`flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition ${
                      active
                        ? "bg-[#3390ec] text-white"
                        : unread > 0
                        ? "bg-blue-50/60 hover:bg-blue-50 dark:bg-blue-950/20 dark:hover:bg-blue-950/40"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {c.otherUser && (
                      <StoryAvatar
                        userId={c.otherUser.id}
                        avatarUrl={c.otherUser.avatar_url}
                        name={displayName(c.otherUser)}
                        size={48}
                        ringWidth={2}
                        onClick={() => void handleSelectConversation(c)}
                      />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p
                          className={`truncate text-sm ${
                            active
                              ? "text-white"
                              : unread > 0
                              ? "font-bold text-slate-900 dark:text-white"
                              : "font-semibold text-slate-900 dark:text-slate-100"
                          }`}
                        >
                          {displayName(c.otherUser)}
                        </p>
                        {c.lastMessageAt && (
                          <span
                            className={`shrink-0 text-xs ${
                              active ? "text-white/80" : "text-slate-500"
                            }`}
                          >
                            {relativeTime(c.lastMessageAt)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`truncate text-sm ${
                            active
                              ? "text-white/80"
                              : unread > 0
                              ? "text-slate-700 dark:text-slate-200"
                              : "text-slate-500"
                          }`}
                        >
                          {preview}
                        </p>

                        {unread > 0 && !active && (
                          <span className="ml-2 shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
                            {unread > 99 ? "99+" : unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      {/* Telegram-style drawer */}
      <div
        className={`fixed inset-0 z-50 ${menuOpen ? "" : "pointer-events-none"}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!menuOpen}
      >
        <div
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          className={`absolute inset-y-0 left-0 flex w-[86%] max-w-[340px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-slate-900 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="relative shrink-0 bg-[#3390ec] px-4 pb-5 pt-5 text-white dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="absolute right-2 top-2 rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 pr-8">
              {myProfile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={myProfile.avatar_url}
                  alt={displayName(myProfile)}
                  className="size-14 shrink-0 rounded-full object-cover ring-2 ring-white/30"
                />
              ) : (
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white/20 text-xl font-semibold">
                  {myProfile ? (
                    displayName(myProfile).charAt(0).toUpperCase()
                  ) : (
                    <UserCircle size={24} />
                  )}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold">
                  {myProfile ? displayName(myProfile) : "Payam User"}
                </p>
                <p className="truncate text-xs text-white/80">
                  @{myProfile?.username || "username"}
                </p>
              </div>
            </div>
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto py-2">
            <Link
              href="/stories"
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center gap-4 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Flame size={20} className="text-slate-400" />
              <span className="flex-1">Stories</span>
              <ChevronRight
                size={16}
                className="text-slate-300 dark:text-slate-600"
              />
            </Link>

            <Link
              href="/contacts"
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center gap-4 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Users size={20} className="text-slate-400" />
              <span className="flex-1">Contacts</span>
              <ChevronRight
                size={16}
                className="text-slate-300 dark:text-slate-600"
              />
            </Link>

            <Link
              href="/settings"
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center gap-4 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Settings size={20} className="text-slate-400" />
              <span className="flex-1">Settings</span>
              <ChevronRight
                size={16}
                className="text-slate-300 dark:text-slate-600"
              />
            </Link>
          </nav>

          <div className="border-t border-slate-200 p-2 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                void signOut();
              }}
              className="flex w-full items-center gap-4 rounded-lg px-3 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}