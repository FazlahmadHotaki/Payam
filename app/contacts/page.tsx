// app/contacts/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MessageCircle,
  Users,
  Search,
  X,
  LoaderCircle,
  AtSign,
} from "lucide-react";
import { useChat } from "@/lib/chat-context";
import { displayName } from "@/lib/chat";

export default function ContactsPage() {
  const router = useRouter();
  const { contacts, loading, openConversation, loadContacts, userId } =
    useChat();

  const [query, setQuery] = useState("");

  // اگر contacts خالی بود ولی کاربر لاگین است، دوباره بگیر
  useEffect(() => {
    if (userId && contacts.length === 0 && !loading) {
      void loadContacts(userId).catch((err) => {
        console.error("Reload contacts failed:", err);
      });
    }
  }, [userId, contacts.length, loading, loadContacts]);

  // فیلتر محلی
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => {
      const haystack = [c.display_name, c.username, c.email]
        .filter((s): s is string => typeof s === "string")
        .map((s) => s.toLowerCase())
        .join(" ");
      return haystack.includes(q);
    });
  }, [contacts, query]);

  const handleOpenChat = async (contact: (typeof contacts)[number]) => {
    await openConversation(contact);
    router.push("/");
  };

  return (
    <main className="h-full overflow-y-auto bg-slate-50 p-4 transition-colors dark:bg-slate-950 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-3xl">
        {/* Back navigation */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-sky-700 transition hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-300"
        >
          <ArrowLeft size={17} />
          Back to chats
        </Link>

        {/* Contacts card */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 sm:rounded-3xl">
          {/* Page heading */}
          <header className="border-b border-slate-100 p-5 dark:border-slate-800 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
                <Users size={22} />
              </div>

              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Contacts
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {loading
                    ? "Loading..."
                    : `${contacts.length} registered ${
                        contacts.length === 1 ? "user" : "users"
                      }`}
                </p>
              </div>
            </div>

            {/* Search bar */}
            {contacts.length > 0 && (
              <div className="relative mt-4">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search contacts by name or @username"
                  className="h-10 w-full rounded-full border-0 bg-slate-100 pl-9 pr-9 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-800 dark:focus:bg-slate-700"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}
          </header>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500">
              <LoaderCircle size={18} className="animate-spin" />
              Loading contacts...
            </div>
          )}

          {/* Empty state */}
          {!loading && contacts.length === 0 && (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                <Users size={26} />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                No other users yet
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Invite someone to join Payam, or search by their username in
                the sidebar.
              </p>
            </div>
          )}

          {/* Empty search result */}
          {!loading && contacts.length > 0 && filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-500">
              No contacts match &quot;{query}&quot;.
            </div>
          )}

          {/* Contacts list */}
          {!loading && filtered.length > 0 && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((contact) => (
                <div
                  key={contact.id}
                  className="flex min-w-0 items-center gap-3 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 sm:px-6"
                >
                  {/* Avatar */}
                  {contact.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={contact.avatar_url}
                      alt={displayName(contact)}
                      className="size-12 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {displayName(contact).charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Name + username + email */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-800 dark:text-slate-100">
                      {displayName(contact)}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-sky-600 dark:text-sky-400">
                      <AtSign size={13} className="shrink-0" />
                      <span className="truncate">
                        {contact.username || "no_username"}
                      </span>
                    </p>
                    {contact.email && (
                      <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-500">
                        {contact.email}
                      </p>
                    )}
                  </div>

                  {/* Action button */}
                  <button
                    type="button"
                    onClick={() => void handleOpenChat(contact)}
                    aria-label={`Open chat with ${displayName(contact)}`}
                    title={`Chat with ${displayName(contact)}`}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sky-700 transition hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-slate-700"
                  >
                    <MessageCircle size={19} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="mt-5 text-center text-xs text-slate-400 dark:text-slate-500">
          Payam · Your contacts
        </p>
      </div>
    </main>
  );
}