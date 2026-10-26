// components/chat/MessageBubble.tsx
"use client";

import { useEffect, useState } from "react";
import {
  CheckCheck,
  Mic,
  Download,
  MoreVertical,
  Copy,
  Trash2,
} from "lucide-react";
import type { Message } from "@/lib/chat";
import { useChat } from "@/lib/chat-context";

type Props = {
  message: Message;
  mine: boolean;
};

export default function MessageBubble({ message, mine }: Props) {
  const { deleteMessageForMe, deleteMessageForEveryone } = useChat();

  const [menu, setMenu] = useState<{ top: number; left: number } | null>(null);

  const isImage = message.content.startsWith("[IMAGE]");
  const isVideo = message.content.startsWith("[VIDEO]");
  const isAudio = message.content.startsWith("[AUDIO]");

  let mediaUrl = "";
  if (isImage || isVideo || isAudio) {
    mediaUrl = message.content.substring(7).trim();
  }

  const hasMedia = isImage || isVideo || isAudio;

  // Close menu on Escape / scroll
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const openMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const menuWidth = 200;
    const menuHeight = mine ? 140 : 100;
    let left = rect.left;
    let top = rect.bottom + 4;
    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8;
    }
    if (top + menuHeight > window.innerHeight - 8) {
      top = rect.top - menuHeight - 4;
    }
    setMenu({ top, left });
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(message.content);
      } else {
        const ta = document.createElement("textarea");
        ta.value = message.content;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
    } catch (err) {
      console.error("Copy failed:", err);
    }
    setMenu(null);
  };

  const handleDeleteForMe = async () => {
    setMenu(null);
    await deleteMessageForMe(message.id);
  };

  const handleDeleteForEveryone = async () => {
    setMenu(null);
    await deleteMessageForEveryone(message.id);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!mediaUrl) return;
    try {
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = isImage ? "jpg" : isVideo ? "mp4" : "webm";
      a.download = `Payam-${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download failed:", err);
      window.open(mediaUrl, "_blank");
    }
  };

  return (
    <>
      <div
        className={`group flex items-center gap-1 ${
          mine ? "justify-end" : "justify-start"
        }`}
      >
        {mine && (
          <button
            type="button"
            onClick={openMenu}
            className="shrink-0 rounded-full p-1 text-slate-400 opacity-0 transition hover:bg-slate-200 group-hover:opacity-100 dark:hover:bg-slate-700"
            title="Message options"
            aria-label="Message options"
          >
            <MoreVertical size={16} />
          </button>
        )}

        <div
          className={`relative max-w-[85%] overflow-hidden rounded-xl px-1.5 py-1.5 shadow-sm sm:max-w-[70%] ${
            mine
              ? "rounded-br-none bg-[#eeffde] text-slate-900 dark:bg-[#2b5278] dark:text-white"
              : "rounded-bl-none bg-white text-slate-900 dark:bg-[#182533] dark:text-white"
          }`}
        >
          {isImage && (
            <div className="group relative overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl}
                alt="Shared image"
                className="max-h-[400px] w-full rounded-lg object-cover"
                loading="lazy"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.src =
                    "https://img.icons8.com/?size=100&id=VZN61f142psg&format=png&color=000000";
                  target.alt = "Image failed to load";
                }}
              />
              <button
                onClick={handleDownload}
                className="absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white opacity-0 backdrop-blur-sm transition hover:bg-black/70 group-hover:opacity-100"
                title="Download Image"
              >
                <Download size={18} />
              </button>
            </div>
          )}

          {isVideo && (
            <div className="group relative overflow-hidden rounded-lg">
              <video
                src={mediaUrl}
                controls
                className="max-h-[300px] w-full rounded-lg"
              />
              <button
                onClick={handleDownload}
                className="absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white opacity-0 backdrop-blur-sm transition hover:bg-black/70 group-hover:opacity-100"
                title="Download Video"
              >
                <Download size={18} />
              </button>
            </div>
          )}

          {isAudio && (
            <div className="flex items-center gap-2 px-2 py-1">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                  mine
                    ? "bg-[#d4f5c1] text-emerald-700 dark:bg-[#3a6b94] dark:text-white"
                    : "bg-blue-100 text-blue-600 dark:bg-slate-700 dark:text-blue-300"
                }`}
              >
                <Mic size={20} />
              </div>
              <audio
                controls
                src={mediaUrl}
                className="h-10 w-40 max-w-[160px] sm:w-64 sm:max-w-xs"
              />
              <button
                onClick={handleDownload}
                className={`ml-1 rounded-full p-2 transition ${
                  mine
                    ? "text-emerald-700 hover:bg-emerald-200/50 dark:text-white dark:hover:bg-slate-700"
                    : "text-blue-500 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-slate-700"
                }`}
                title="Download Audio"
              >
                <Download size={18} />
              </button>
            </div>
          )}

          {!hasMedia && (
            <p className="whitespace-pre-wrap break-words px-2 pt-1 text-[15px] leading-snug">
              {message.content}
            </p>
          )}

          <div
            className={`mt-1 flex items-center justify-end gap-1 px-1 pb-0.5 text-[11px] ${
              mine
                ? "text-emerald-600 dark:text-blue-200"
                : "text-slate-400 dark:text-slate-500"
            } ${
              hasMedia
                ? "absolute bottom-2 right-2 rounded-md bg-black/40 px-1.5 py-0.5 text-white backdrop-blur-sm"
                : ""
            }`}
          >
            <span>
              {new Date(message.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {mine && <CheckCheck size={14} className="ml-0.5" />}
          </div>
        </div>

        {!mine && (
          <button
            type="button"
            onClick={openMenu}
            className="shrink-0 rounded-full p-1 text-slate-400 opacity-0 transition hover:bg-slate-200 group-hover:opacity-100 dark:hover:bg-slate-700"
            title="Message options"
            aria-label="Message options"
          >
            <MoreVertical size={16} />
          </button>
        )}
      </div>

      {menu && (
        <>
          <div
            className="fixed inset-0 z-[99]"
            onClick={() => setMenu(null)}
          />
          <div
            className="fixed z-[100] min-w-[180px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
            style={{ top: menu.top, left: menu.left }}
            onClick={(e) => e.stopPropagation()}
          >
            {!hasMedia && (
              <button
                onClick={handleCopy}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Copy size={16} /> Copy
              </button>
            )}

            <button
              onClick={handleDeleteForMe}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              <Trash2 size={16} /> Delete for me
            </button>

            {mine && (
              <button
                onClick={handleDeleteForEveryone}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
              >
                <Trash2 size={16} /> Delete for everyone
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}