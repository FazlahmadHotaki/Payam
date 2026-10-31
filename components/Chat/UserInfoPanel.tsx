// components/chat/UserInfoPanel.tsx
"use client";

import { useEffect, useState } from "react";
import { X, Archive, LoaderCircle, MessageSquare } from "lucide-react";
import { useChat } from "@/lib/chat-context";
import {
  displayName,
  relativeTime,
  type Profile,
  type StoryGroup,
} from "@/lib/chat";

interface Props {
  user: Profile | null;
  open: boolean;
  onClose: () => void;
}

export default function UserInfoPanel({ user, open, onClose }: Props) {
  const { getUserStories, openStoryGroup } = useChat();

  const [active, setActive] = useState<StoryGroup | null>(null);
  const [archived, setArchived] = useState<StoryGroup | null>(null);
  const [loading, setLoading] = useState(false);

  // Body scroll lock + ESC
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // Stable primitive → no exhaustive-deps warning
  const targetUserId = user?.id ?? null;

  // Load stories every time it opens
  useEffect(() => {
    if (!open || !targetUserId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const res = await getUserStories(targetUserId);
      if (cancelled) return;
      setActive(res.active);
      setArchived(res.archived);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, targetUserId, getUserStories]);

  if (!user) return null;

  const name = displayName(user);
  const initial = name.charAt(0).toUpperCase();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[55] bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-[56] flex w-[88%] max-w-[400px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-slate-900 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
      >
        {/* Header bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Profile info
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto">
          {/* ─── Profile card ─── */}
          <div className="flex flex-col items-center gap-2 px-6 pb-5 pt-6 text-center">
            {user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar_url}
                alt={name}
                className="size-24 rounded-full object-cover ring-4 ring-blue-500/10"
              />
            ) : (
              <div className="flex size-24 items-center justify-center rounded-full bg-blue-600 text-3xl font-semibold text-white ring-4 ring-blue-500/10">
                {initial}
              </div>
            )}
            <div className="mt-1 min-w-0">
              <p className="truncate text-lg font-semibold text-slate-900 dark:text-white">
                {name}
              </p>
              <p className="truncate text-sm text-blue-500 dark:text-blue-400">
                @{user.username || "no_username"}
              </p>
              {user.email && (
                <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                  {user.email}
                </p>
              )}
            </div>
          </div>

          {/* ─── Loading ─── */}
          {loading && (
            <div className="flex justify-center py-6 text-slate-400">
              <LoaderCircle className="animate-spin" size={20} />
            </div>
          )}

          {/* ─── Active stories ─── */}
          {!loading && active && (
            <section className="border-t border-slate-200 px-4 py-4 dark:border-slate-800">
              <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <span className="inline-block size-2 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600" />
                Current stories ({active.stories.length})
              </h3>
              <StoryThumbnails
                group={active}
                onOpen={(i) => openStoryGroup(active, true, i)}
              />
            </section>
          )}

          {/* ─── Archived stories ─── */}
          {!loading && archived && (
            <section className="border-t border-slate-200 px-4 py-4 dark:border-slate-800">
              <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <Archive size={12} />
                Archived ({archived.stories.length})
              </h3>
              <StoryThumbnails
                group={archived}
                onOpen={(i) => openStoryGroup(archived, false, i)}
                dim
              />
            </section>
          )}

          {/* ─── Empty ─── */}
          {!loading && !active && !archived && (
            <div className="border-t border-slate-200 px-4 py-8 text-center dark:border-slate-800">
              <MessageSquare
                size={28}
                className="mx-auto mb-2 text-slate-300 dark:text-slate-600"
              />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No stories yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function StoryThumbnails({
  group,
  onOpen,
  dim = false,
}: {
  group: StoryGroup;
  onOpen: (index: number) => void;
  dim?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {group.stories.map((s, i) => (
        <button
          key={s.id}
          onClick={() => onOpen(i)}
          className={`relative aspect-square overflow-hidden rounded-lg bg-slate-200 transition hover:opacity-90 dark:bg-slate-800 ${
            dim ? "opacity-75" : ""
          }`}
        >
          {s.media_type === "video" ? (
            <video
              src={s.media_url}
              className="size-full object-cover"
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={s.media_url}
              alt=""
              className="size-full object-cover"
            />
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1 py-0.5 text-[10px] text-white">
            {relativeTime(s.created_at)}
          </div>
        </button>
      ))}
    </div>
  );
}