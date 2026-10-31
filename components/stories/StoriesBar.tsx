// components/stories/StoriesBar.tsx
"use client";

import { useState } from "react";
import { Plus, LoaderCircle, Repeat2 } from "lucide-react";
import { useChat } from "@/lib/chat-context";
import { displayName } from "@/lib/chat";
import StoryCreator from "@/components/stories/StoryCreator";

export default function StoriesBar() {
  const { stories, myProfile, loadingStories, userId, openStory } = useChat();
  const [creatorOpen, setCreatorOpen] = useState(false);

  const myStory = stories.find((g) => g.user.id === userId);

  return (
    <>
      <div className="scrollbar-hidden flex shrink-0 items-center gap-3 overflow-x-auto border-b border-slate-200 bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-900">
        {/* + Your story */}
        <button
          type="button"
          onClick={() => setCreatorOpen(true)}
          className="flex shrink-0 flex-col items-center gap-1"
        >
          <div className="relative flex size-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            {myProfile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={myProfile.avatar_url}
                alt={displayName(myProfile)}
                className="size-14 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-14 items-center justify-center rounded-full bg-blue-600 text-lg font-semibold text-white">
                {myProfile ? displayName(myProfile).charAt(0).toUpperCase() : "?"}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full border-2 border-white bg-blue-600 dark:border-slate-900">
              <Plus size={12} className="text-white" />
            </div>
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400">
            Your story
          </span>
        </button>

        {loadingStories && (
          <div className="flex shrink-0 flex-col items-center gap-1">
            <div className="flex size-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <LoaderCircle size={20} className="animate-spin text-slate-400" />
            </div>
          </div>
        )}

        {/* Other users' stories */}
        {stories
          .filter((g) => g.user.id !== userId)
          .map((group) => {
            const last = group.stories[group.stories.length - 1];
            const isReposted = !!last?.reposted_from_user;
            return (
              <button
                key={group.user.id}
                type="button"
                onClick={() => openStory(group.user.id)}
                className="flex shrink-0 flex-col items-center gap-1"
              >
                <div
                  className={`relative flex size-14 items-center justify-center rounded-full p-[2px] ${
                    group.allViewed
                      ? "bg-slate-300 dark:bg-slate-700"
                      : "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600"
                  }`}
                >
                  {group.user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={group.user.avatar_url}
                      alt={displayName(group.user)}
                      className="size-[52px] rounded-full object-cover ring-2 ring-white dark:ring-slate-900"
                    />
                  ) : (
                    <div className="flex size-[52px] items-center justify-center rounded-full bg-blue-600 text-lg font-semibold text-white ring-2 ring-white dark:ring-slate-900">
                      {displayName(group.user).charAt(0).toUpperCase()}
                    </div>
                  )}
                  {isReposted && (
                    <div className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full border-2 border-white bg-blue-600 dark:border-slate-900">
                      <Repeat2 size={10} className="text-white" />
                    </div>
                  )}
                </div>
                <span className="max-w-[64px] truncate text-[11px] text-slate-600 dark:text-slate-400">
                  {displayName(group.user).split(" ")[0]}
                </span>
              </button>
            );
          })}

        {/* My own story */}
        {myStory && (
          <button
            type="button"
            onClick={() => openStory(userId)}
            className="flex shrink-0 flex-col items-center gap-1"
          >
            <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
              {myProfile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={myProfile.avatar_url}
                  alt="Me"
                  className="size-[52px] rounded-full object-cover ring-2 ring-white dark:ring-slate-900"
                />
              ) : (
                <div className="flex size-[52px] items-center justify-center rounded-full bg-blue-600 text-lg font-semibold text-white ring-2 ring-white dark:ring-slate-900">
                  {myProfile
                    ? displayName(myProfile).charAt(0).toUpperCase()
                    : "?"}
                </div>
              )}
            </div>
            <span className="max-w-[64px] truncate text-[11px] text-slate-600 dark:text-slate-400">
              You
            </span>
          </button>
        )}
      </div>

      <StoryCreator open={creatorOpen} onClose={() => setCreatorOpen(false)} />
    </>
  );
}