// app/stories/page.tsx
"use client";

import { useChat } from "@/lib/chat-context";
import { displayName, relativeTime } from "@/lib/chat";
import StoryAvatar from "@/components/stories/StoryAvatar";

export default function StoriesPage() {
  const { stories, openStory, userId } = useChat();

  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-lg font-semibold">Stories</h1>

      {stories.length === 0 ? (
        <p className="text-sm text-slate-500">No active stories.</p>
      ) : (
        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
          {stories.map((g) => {
            const last = g.stories[g.stories.length - 1];
            const isMine = g.user.id === userId;

            return (
              <li key={g.user.id}>
                <button
                  onClick={() => openStory(g.user.id)}
                  className="flex w-full items-center gap-3 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <StoryAvatar
                    userId={g.user.id}
                    avatarUrl={g.user.avatar_url}
                    name={displayName(g.user)}
                    size={52}
                    ringWidth={2}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {isMine ? "You" : displayName(g.user)}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {g.stories.length} stor
                      {g.stories.length === 1 ? "y" : "ies"}
                      {last ? ` • ${relativeTime(last.created_at)}` : ""}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}