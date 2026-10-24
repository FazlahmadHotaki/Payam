
import Link from "next/link";
import { ArrowLeft, MessageCircle, Users } from "lucide-react";

import { initialChats } from "@/lib/data";
import Avatar from "@/components/ui/Avatar";

export default function ContactsPage() {
  return (
    <main className="min-h-dvh bg-slate-50 p-4 transition-colors dark:bg-slate-950 sm:p-8 lg:p-10">
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
                  {initialChats.length} demo contacts
                </p>
              </div>
            </div>
          </header>

          {/* Contacts list */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {initialChats.map((chat) => (
              <div
                key={chat.id}
                className="flex min-w-0 items-center gap-3 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 sm:px-6"
              >
                <Avatar
                  src={chat.avatar}
                  name={chat.name}
                  size={50}
                  online={chat.online}
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-800 dark:text-slate-100">
                    {chat.name}
                  </p>

                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    {chat.online ? "Online" : "Last seen recently"}
                  </p>
                </div>

                <Link
                  href="/"
                  aria-label={`Open chat with ${chat.name}`}
                  title={`Chat with ${chat.name}`}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sky-700 transition hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-slate-700"
                >
                  <MessageCircle size={19} />
                </Link>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-5 text-center text-xs text-slate-400 dark:text-slate-500">
          Telechat · Your contacts
        </p>
      </div>
    </main>
  );
}