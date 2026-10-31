// components/Chat/ChatHeader.tsx
"use client";

import { useState } from "react";
import StoryAvatar from "@/components/stories/StoryAvatar";
import UserInfoPanel from "@/components/Chat/UserInfoPanel";
import { displayName, type Conversation } from "@/lib/chat";

type Props = {
  conversation: Conversation;
};

export default function ChatHeader({ conversation }: Props) {
  const [infoOpen, setInfoOpen] = useState(false);

  const other = conversation.otherUser;
  const name = displayName(other);

  return (
    <>
      <header
        onClick={() => setInfoOpen(true)}
        onKeyDown={(e) => {
          if (
            (e.key === "Enter" || e.key === " ") &&
            e.target === e.currentTarget
          ) {
            e.preventDefault();
            setInfoOpen(true);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`Open ${name}'s profile info`}
        className="flex h-14 shrink-0 cursor-pointer items-center gap-3 border-b border-slate-200 bg-white px-3 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60"
      >
        {other && (
          <StoryAvatar
            userId={other.id}
            avatarUrl={other.avatar_url}
            name={name}
            size={40}
            ringWidth={2}
            onStoryClick={() => setInfoOpen(true)}
            onClick={() => setInfoOpen(true)}
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {name}
          </p>
          <p className="truncate text-xs text-blue-500 dark:text-blue-400">
            @{other?.username || "no_username"}
          </p>
        </div>
      </header>

      <UserInfoPanel
        user={other}
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
      />
    </>
  );
}