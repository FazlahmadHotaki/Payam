// components/stories/StoryViewer.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, Trash2 } from "lucide-react";
import { useChat } from "@/lib/chat-context";
import { displayName, relativeTime, type StoryGroup } from "@/lib/chat";

type Props = {
  group: StoryGroup | null;
  onClose: () => void;
};

export default function StoryViewer({ group, onClose }: Props) {
  const { viewStory, deleteStory, userId } = useChat();
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<number | null>(null);

  // ریست ایندکس وقتی گروه عوض شد
  useEffect(() => {
    if (group) {
      setIndex(0);
      setProgress(0);
    }
  }, [group]);

  const current = group?.stories[index];

  // علامت‌گذاری به‌عنوان دیده‌شده
  useEffect(() => {
    if (current && !current.viewed) {
      void viewStory(current.id);
    }
  }, [current, viewStory]);

  // پیشرفت ۵ ثانیه‌ای (یا تا پایان ویدیو)
  useEffect(() => {
    if (!current) return;
    setProgress(0);

    const isVideo = current.media_type === "video";
    const duration = isVideo ? null : 5000;

    if (isVideo) {
      // برای ویدیو، از ontimeupdate استفاده می‌کنیم
      return;
    }

    const start = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / (duration ?? 5000)) * 100);
      setProgress(pct);
      if (pct >= 100) {
        window.clearInterval(id);
        goNext();
      }
    }, 50);

    timerRef.current = id;
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [current]);

  const goNext = () => {
    if (!group) return;
    if (index < group.stories.length - 1) {
      setIndex(index + 1);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (index > 0) setIndex(index - 1);
  };

  if (!group || !current) return null;

  const name = displayName(group.user);
  const initial = name.charAt(0).toUpperCase();
  const isMine = current.user_id === userId;

  const handleVideoTime = () => {
    const v = videoRef.current;
    if (!v) return;
    const pct = v.duration ? (v.currentTime / v.duration) * 100 : 0;
    setProgress(pct);
    if (v.duration && v.currentTime >= v.duration - 0.1) {
      goNext();
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this story?")) return;
    const ok = await deleteStory(current.id);
    if (ok) {
      if (group.stories.length <= 1) onClose();
      else setIndex(Math.min(index, group.stories.length - 2));
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black">
      {/* Progress bars بالای صفحه */}
      <div className="absolute left-0 right-0 top-0 z-10 flex gap-1 p-2">
        {group.stories.map((s, i) => (
          <div
            key={s.id}
            className="h-1 flex-1 overflow-hidden rounded-full bg-white/30"
          >
            <div
              className="h-full bg-white transition-[width] duration-100"
              style={{
                width:
                  i < index ? "100%" : i === index ? `${progress}%` : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute left-0 right-0 top-4 z-10 flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-2">
          {group.user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={group.user.avatar_url}
              alt={name}
              className="size-10 rounded-full object-cover ring-2 ring-white"
            />
          ) : (
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white ring-2 ring-white">
              {initial}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-white">{name}</p>
            <p className="text-xs text-white/70">
              {relativeTime(current.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isMine && (
            <button
              onClick={() => void handleDelete()}
              className="rounded-full p-2 text-white hover:bg-white/10"
              aria-label="Delete story"
            >
              <Trash2 size={20} />
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white hover:bg-white/10"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Story content */}
      <div className="relative flex h-full w-full max-w-lg items-center justify-center">
        {current.media_type === "video" ? (
          <video
            ref={videoRef}
            src={current.media_url}
            autoPlay
            onTimeUpdate={handleVideoTime}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.media_url}
            alt="Story"
            className="max-h-full max-w-full object-contain"
          />
        )}

        {current.caption && (
          <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-black/60 px-4 py-2 text-center text-sm text-white backdrop-blur-sm">
            {current.caption}
          </div>
        )}

        {/* Left/Right tap zones */}
        <button
          onClick={goPrev}
          className="absolute left-0 top-0 z-10 flex h-full w-1/3 items-center justify-start pl-4 opacity-0 hover:opacity-100"
          aria-label="Previous"
        >
          <ChevronLeft size={32} className="text-white" />
        </button>
        <button
          onClick={goNext}
          className="absolute right-0 top-0 z-10 flex h-full w-1/3 items-center justify-end pr-4 opacity-0 hover:opacity-100"
          aria-label="Next"
        >
          <ChevronRight size={32} className="text-white" />
        </button>
      </div>
    </div>
  );
}