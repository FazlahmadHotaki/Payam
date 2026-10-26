// components/chat/MessageBubble.tsx
"use client";

import { CheckCheck, Mic, Download } from "lucide-react";
import type { Message } from "@/lib/chat";

type Props = {
  message: Message;
  mine: boolean;
};

export default function MessageBubble({ message, mine }: Props) {
  // Parse media prefixes
  const isImage = message.content.startsWith("[IMAGE]");
  const isVideo = message.content.startsWith("[VIDEO]");
  const isAudio = message.content.startsWith("[AUDIO]");

  let mediaUrl = "";
  if (isImage || isVideo || isAudio) {
    // Remove the prefix (e.g., "[IMAGE]") to get the URL
    mediaUrl = message.content.substring(7).trim();
  }

  const hasMedia = isImage || isVideo || isAudio;

  // Download function that forces the browser to save the file
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!mediaUrl) return;

    try {
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;

      // Determine file extension
      const ext = isImage ? "jpg" : isVideo ? "mp4" : "webm";
      a.download = `Payam-${Date.now()}.${ext}`;

      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback: open in new tab
      window.open(mediaUrl, "_blank");
    }
  };

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative max-w-[85%] overflow-hidden rounded-xl px-1.5 py-1.5 shadow-sm sm:max-w-[70%] ${
          mine
            ? "rounded-br-none bg-[#eeffde] text-slate-900 dark:bg-[#2b5278] dark:text-white"
            : "rounded-bl-none bg-white text-slate-900 dark:bg-[#182533] dark:text-white"
        }`}
      >
        {/* IMAGE RENDER — از mediaUrl واقعی استفاده می‌کند */}
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
                // اگر URL خراب بود، به placeholder برگرد
                target.src =
                  "https://img.icons8.com/?size=100&id=VZN61f142psg&format=png&color=000000";
                target.alt = "Image failed to load";
              }}
            />

            {/* Image Hover Download Button */}
            <button
              onClick={handleDownload}
              className="absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white opacity-0 backdrop-blur-sm transition hover:bg-black/70 group-hover:opacity-100"
              title="Download Image"
            >
              <Download size={18} />
            </button>
          </div>
        )}

        {/* VIDEO RENDER */}
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

        {/* AUDIO RENDER */}
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

        {/* TEXT RENDER (If no media) */}
        {!hasMedia && (
          <p className="whitespace-pre-wrap break-words px-2 pt-1 text-[15px] leading-snug">
            {message.content}
          </p>
        )}

        {/* Timestamp & Read Receipts */}
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
    </div>
  );
}