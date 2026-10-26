
"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, Plus, Search, X } from "lucide-react";
import { useChat } from "@/lib/chat-context";
import { displayName, type Profile } from "@/lib/chat";

type Story = {
  id: string;
  name: string;
  image?: string;
  profile?: Profile;
};

type Props = {
  onMenuClick?: () => void;
};

export default function Header({ onMenuClick }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname() ?? "/";
  const { contacts, openConversation } = useChat();

  const [myStory, setMyStory] = useState<string | null>(null);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [query, setQuery] = useState("");

  const showStories = pathname === "/";

  const stories: Story[] = contacts.map((contact) => ({
    id: contact.id,
    name: displayName(contact),
    profile: contact,
  }));

  const filtered = stories.filter((story) =>
    story.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  function handleAddStory(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      e.target.value = "";
      return;
    }

    const url = URL.createObjectURL(file);

    setMyStory((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return url;
    });

    e.target.value = "";
  }

  function handleMyStory() {
    if (myStory) {
      setActiveStory({
        id: "my",
        name: "Your story",
        image: myStory,
      });
    } else {
      fileInputRef.current?.click();
    }
  }

  return (
    <>
      <header className="w-full min-w-0 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {/* Top bar */}
        <div className="mx-auto flex h-[54px] w-full max-w-7xl items-center gap-2 px-3 md:px-4">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open menu"
            className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search stories and contacts"
              className="h-9 w-full rounded-full border-0 bg-slate-100 pl-9 pr-9 text-sm text-slate-800 outline-none transition placeholder:text-slate-500 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:bg-slate-700 dark:focus:ring-blue-950"
            />

            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <h1 className="hidden text-base font-bold text-blue-600 sm:block">
            Telechat
          </h1>
        </div>

        {/* Stories strip */}
        {showStories && (
          <div className="mx-auto w-full max-w-7xl px-3 pb-2 md:px-4">
            <div className="story-scroll flex w-full min-w-0 items-start gap-2.5 overflow-x-auto overscroll-x-contain md:gap-3">
              {/* Your story */}
              <button
                type="button"
                onClick={handleMyStory}
                className="group flex w-12 shrink-0 flex-col items-center gap-0.5"
                aria-label={myStory ? "View your story" : "Add your story"}
              >
                <span className="relative flex size-9 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-blue-500 bg-blue-50 transition group-hover:bg-blue-100 dark:bg-slate-800 dark:group-hover:bg-slate-700">
                  {myStory ? (
                    <Image
                      src={myStory}
                      alt="Your story"
                      fill
                      unoptimized
                      sizes="36px"
                      className="object-cover"
                    />
                  ) : (
                    <Plus
                      size={16}
                      className="text-blue-600 dark:text-blue-400"
                    />
                  )}

                  <span className="absolute -bottom-0.5 -right-0.5 flex size-3 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white dark:border-slate-900">
                    <Plus size={7} strokeWidth={3} />
                  </span>
                </span>

                <span className="w-12 truncate text-center text-[10px] leading-tight text-slate-600 dark:text-slate-300">
                  You
                </span>
              </button>

              {/* Contact stories */}
              {filtered.map((story) => (
                <button
                  key={story.id}
                  type="button"
                  onClick={() => {
                    if (story.profile) {
                      void openConversation(story.profile);
                    }
                  }}
                  className="group flex w-12 shrink-0 flex-col items-center gap-0.5"
                  aria-label={`Chat with ${story.name}`}
                >
                  <span className="relative size-9 rounded-full bg-gradient-to-tr from-orange-400 via-pink-500 to-purple-600 p-[2px] transition group-hover:scale-105">
                    <span className="flex size-full items-center justify-center rounded-full bg-white p-[2px] dark:bg-slate-900">
                      <span className="flex size-full items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {story.name.charAt(0).toUpperCase()}
                      </span>
                    </span>
                  </span>

                  <span className="w-12 truncate text-center text-[10px] leading-tight text-slate-600 dark:text-slate-300">
                    {story.name}
                  </span>
                </button>
              ))}

              {filtered.length === 0 && (
                <p className="py-2 text-xs text-slate-400">
                  {query ? "No stories found." : "No contacts yet."}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Hidden image picker */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAddStory}
        />

        <style jsx>{`
          .story-scroll {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .story-scroll::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </header>

      {/* Story viewer */}
      {activeStory && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-2 sm:p-4"
          onClick={() => setActiveStory(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${activeStory.name}'s story`}
            className="relative h-[85dvh] max-h-[800px] w-full max-w-sm overflow-hidden rounded-2xl bg-slate-900 sm:h-[75vh] md:max-w-md lg:max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {activeStory.image && (
              <Image
                src={activeStory.image}
                alt={`${activeStory.name}'s story`}
                fill
                unoptimized
                sizes="(max-width: 640px) 100vw, 448px"
                className="object-contain"
              />
            )}

            <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent p-3 text-white sm:p-4">
              <span className="truncate pr-3 font-semibold">
                {activeStory.name}
              </span>

              <button
                type="button"
                aria-label="Close story"
                onClick={() => setActiveStory(null)}
                className="shrink-0 rounded-full bg-black/30 p-2 transition hover:bg-black/50"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
