// components/stories/StoryAvatar.tsx
"use client";

import { useChat } from "@/lib/chat-context";

interface StoryAvatarProps {
  userId: string;
  avatarUrl?: string | null;
  name: string;
  size?: number;
  ringWidth?: number;
  className?: string;
  /** Fallback click handler when the user has no active story */
  onClick?: () => void;
  /** If provided, overrides opening the story when the user HAS one */
  onStoryClick?: () => void;
}

export default function StoryAvatar({
  userId,
  avatarUrl,
  name,
  size = 48,
  ringWidth = 2,
  className = "",
  onClick,
  onStoryClick,
}: StoryAvatarProps) {
  const { stories, openStory } = useChat();

  const group = stories.find((g) => g.user.id === userId);
  const hasStory = !!group;
  const allViewed = group?.allViewed ?? false;

  const initial = name.charAt(0).toUpperCase();
  const inner = size - ringWidth * 2;

  const handleClick = (e: React.MouseEvent) => {
    if (hasStory) {
      e.stopPropagation();
      if (onStoryClick) onStoryClick();
      else openStory(userId);
    } else {
      onClick?.();
    }
  };

  const innerContent = avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl}
      alt={name}
      className="rounded-full object-cover"
      style={{ width: inner, height: inner }}
    />
  ) : (
    <div
      className="flex items-center justify-center rounded-full bg-blue-600 font-semibold text-white"
      style={{ width: inner, height: inner, fontSize: Math.round(inner * 0.4) }}
    >
      {initial}
    </div>
  );

  if (!hasStory) {
    return (
      <div
        onClick={handleClick}
        className={`shrink-0 ${onClick ? "cursor-pointer" : ""} ${className}`}
        style={{ width: size, height: size }}
      >
        {innerContent}
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          if (onStoryClick) onStoryClick();
          else openStory(userId);
        }
      }}
      className={`shrink-0 cursor-pointer rounded-full ${
        allViewed
          ? "bg-slate-300 dark:bg-slate-700"
          : "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600"
      } ${className}`}
      style={{ width: size, height: size, padding: ringWidth }}
    >
      <div className="flex size-full items-center justify-center overflow-hidden rounded-full bg-white dark:bg-slate-900">
        {innerContent}
      </div>
    </div>
  );
}