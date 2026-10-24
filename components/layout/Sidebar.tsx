// components/layout/Sidebar.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Search, X, Users, Settings, LogOut, UserCircle, LoaderCircle } from "lucide-react";
import { displayName, relativeTime } from "@/lib/chat";
import { useChat } from "@/lib/chat-context";
import { supabase } from "@/lib/supabase/client";
import type { Conversation, Profile } from "@/lib/chat";

export default function Sidebar() {
  const {
    conversations,
    activeConversation,
    myProfile,
    loading,
    selectConversation,
    openConversation,
    signOut,
  } = useChat();

  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Global search states
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search logic
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      const searchTerm = `%${query.trim()}%`;
      
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, email, username")
        .neq("id", myProfile?.id) // Don't show yourself
        .or(`display_name.ilike.${searchTerm},username.ilike.${searchTerm},email.ilike.${searchTerm}`)
        .limit(20);

      if (data) setSearchResults(data as Profile[]);
      setIsSearching(false);
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounce);
  }, [query, myProfile?.id]);

  // Helper to handle clicking a user from search
  const handleStartChat = async (profile: Profile) => {
    await openConversation(profile);
    setQuery(""); // clear search
  };

  return (
    <aside className="relative flex h-full w-full flex-col bg-white dark:bg-slate-900">
      {/* Top Bar: Hamburger + Search + Profile */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 px-3 dark:border-slate-800">
        
        {/* Hamburger Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Menu size={20} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40 cursor-default" onClick={() => setMenuOpen(false)} />
              <div className="absolute left-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center gap-3 border-b border-slate-100 p-3 dark:border-slate-700">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                    {myProfile ? displayName(myProfile).charAt(0).toUpperCase() : <UserCircle size={20} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {myProfile ? displayName(myProfile) : "Payam User"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      @{myProfile?.username || "username"}
                    </p>
                  </div>
                </div>
                <div className="py-1">
                  <Link href="/contacts" onClick={() => setMenuOpen(false)} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700">
                    <Users size={18} className="text-slate-400" /> Contacts
                  </Link>
                  <Link href="/settings" onClick={() => setMenuOpen(false)} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700">
                    <Settings size={18} className="text-slate-400" /> Settings
                  </Link>
                </div>
                <div className="border-t border-slate-100 py-1 dark:border-slate-700">
                  <button type="button" onClick={() => { setMenuOpen(false); void signOut(); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40">
                    <LogOut size={18} /> Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people or @username"
            className="h-9 w-full rounded-full border-0 bg-slate-100 pl-9 pr-8 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-800 dark:focus:bg-slate-700"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700">
              <X size={14} />
            </button>
          )}
        </div>

        {/* My Avatar */}
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
          {myProfile ? displayName(myProfile).charAt(0).toUpperCase() : "?"}
        </div>
      </div>

      {/* Main List */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* If searching, show search results */}
        {query.trim() ? (
          <>
            {isSearching ? (
              <div className="flex justify-center p-4 text-slate-500">
                <LoaderCircle className="animate-spin" size={20} />
              </div>
            ) : searchResults.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-500">No users found for "{query}".</p>
            ) : (
              searchResults.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => void handleStartChat(profile)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {displayName(profile).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {displayName(profile)}
                    </p>
                    <p className="truncate text-xs text-blue-500 dark:text-blue-400">
                      @{profile.username || "no_username"}
                    </p>
                  </div>
                </button>
              ))
            )}
          </>
        ) : (
          /* If not searching, show Recent Chats */
          <>
            {loading ? (
              <p className="p-4 text-center text-sm text-slate-500">Loading...</p>
            ) : conversations.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-500">No chats yet.</p>
            ) : (
              conversations.map((c) => {
                const active = activeConversation?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => selectConversation(c)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${
                      active ? "bg-[#3390ec] text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className={`flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold ${active ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"}`}>
                      {displayName(c.otherUser).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className={`truncate text-sm font-semibold ${active ? "text-white" : "text-slate-900 dark:text-slate-100"}`}>
                          {displayName(c.otherUser)}
                        </p>
                        <span className={`shrink-0 text-xs ${active ? "text-white/80" : "text-slate-500"}`}>
                          {relativeTime(c.updatedAt)}
                        </span>
                      </div>
                      <p className={`truncate text-sm ${active ? "text-white/80" : "text-slate-500"}`}>
                        {c.otherUser.username ? `@${c.otherUser.username}` : c.otherUser.email}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </>
        )}
      </div>
    </aside>
  );
}