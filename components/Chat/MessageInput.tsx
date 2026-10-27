// components/chat/MessageInput.tsx
"use client";

import { useRef, useState } from "react";
import {
  Send,
  Smile,
  Mic,
  Trash2,
  Paperclip,
  LoaderCircle,
  FileText,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import Image from "next/image";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  sending: boolean;
};

const EMOJIS = [
  "😀", "😂", "😍", "🥰", "😎", "🤔", "😭", "😡",
  "👍", "👎", "👏", "🙏", "🔥", "❤️",
];

/** حداکثر اندازه فایل (۲۵ مگابایت) */
const MAX_FILE_SIZE = 25 * 1024 * 1024;

function fileExt(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

function fileAccent(ext: string): string {
  if (ext === "pdf") return "text-red-500";
  if (["doc", "docx", "txt", "rtf", "odt"].includes(ext)) return "text-blue-500";
  if (["xls", "xlsx", "csv", "ods"].includes(ext)) return "text-green-600";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "text-amber-500";
  if (["ppt", "pptx", "odp"].includes(ext)) return "text-orange-500";
  return "text-slate-500";
}

type MediaKind = "IMAGE" | "VIDEO" | "AUDIO" | "FILE";

export default function MessageInput({
  value,
  onChange,
  onSubmit,
  sending,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showEmoji, setShowEmoji] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaKind | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // ============================================================
  // انتخاب فایل (همه‌ی انواع)
  // ============================================================
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert("File must be smaller than 25 MB.");
      e.target.value = "";
      return;
    }

    let kind: MediaKind = "FILE";
    if (file.type.startsWith("image/")) kind = "IMAGE";
    else if (file.type.startsWith("video/")) kind = "VIDEO";
    else if (file.type.startsWith("audio/")) kind = "AUDIO";

    setSelectedFile(file);
    setMediaType(kind);

    // پیش‌نمایش فقط برای image و video
    if (kind === "IMAGE" || kind === "VIDEO") {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }

    e.target.value = "";
  };

  const cancelMedia = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setMediaType(null);
  };

  // ============================================================
  // آپلود و ارسال
  // ============================================================
  const uploadAndSendMedia = async () => {
    if (!selectedFile || !mediaType) return;
    setIsUploading(true);

    try {
      const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "bin";
      const safeExt = /^[a-z0-9]{1,8}$/.test(ext) ? ext : "bin";
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${safeExt}`;

      const { error } = await supabase.storage
        .from("chat-media")
        .upload(fileName, selectedFile, {
          contentType: selectedFile.type || "application/octet-stream",
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("chat-media")
        .getPublicUrl(fileName);

      let content: string;
      if (mediaType === "FILE") {
        // [FILE]filename|url
        const safeName = selectedFile.name.replace(/\|/g, "_");
        content = `[FILE]${safeName}|${urlData.publicUrl}`;
      } else {
        content = `[${mediaType}]${urlData.publicUrl}`;
      }

      onChange(content);
      cancelMedia();

      setTimeout(() => {
        if (textareaRef.current?.form) textareaRef.current.form.requestSubmit();
      }, 50);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unknown error occurred.";
      alert("Upload failed: " + message);
    } finally {
      setIsUploading(false);
    }
  };

  // ============================================================
  // Voice recording
  // ============================================================
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      alert("Microphone access denied.");
    }
  };

  const sendVoiceMessage = async () => {
    if (!mediaRecorderRef.current) return;
    setIsUploading(true);

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });
      const fileName = `${Date.now()}.webm`;

      const { error } = await supabase.storage
        .from("chat-media")
        .upload(fileName, audioBlob);

      if (error) {
        alert("Upload failed");
        setIsUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("chat-media")
        .getPublicUrl(fileName);
      onChange(`[AUDIO]${urlData.publicUrl}`);

      setTimeout(() => {
        if (textareaRef.current?.form) textareaRef.current.form.requestSubmit();
      }, 50);

      setIsUploading(false);
    };

    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    setIsRecording(false);
  };

  // ============================================================
  // Render
  // ============================================================
  const hasSelection = !!selectedFile && !!mediaType;
  const isMediaPreview = mediaType === "IMAGE" || mediaType === "VIDEO";
  const selectedExt = selectedFile ? fileExt(selectedFile.name) : "";

  return (
    <div className="relative border-t border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900 sm:p-3">
      {/* ============ PREVIEW (تصویر / ویدیو / فایل) ============ */}
      {hasSelection && (
        <div className="mb-3 flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
          {isMediaPreview ? (
            <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-700">
              {mediaType === "IMAGE" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl ?? ""}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <video src={previewUrl ?? ""} className="h-full w-full object-cover" />
              )}
            </div>
          ) : (
            <div
              className={`flex size-20 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-700 ${fileAccent(
                selectedExt
              )}`}
            >
              <FileText size={32} />
            </div>
          )}

          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <p className="truncate text-sm font-medium">
              {mediaType === "FILE"
                ? selectedFile!.name
                : `Ready to send ${mediaType?.toLowerCase()}`}
            </p>
            <p className="text-xs text-slate-500">
              {mediaType === "FILE" && (
                <span className="mr-1 uppercase">{selectedExt || "file"} · </span>
              )}
              {(selectedFile!.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

          <button
            onClick={cancelMedia}
            className="p-2 text-slate-400 hover:text-red-500"
            aria-label="Cancel"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}

      {/* ============ EMOJI PICKER ============ */}
      {showEmoji && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowEmoji(false)}
          />
          <div className="absolute bottom-16 left-2 z-50 flex w-64 flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onChange(value + emoji);
                  setShowEmoji(false);
                }}
                className="flex size-9 items-center justify-center rounded-lg text-2xl hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}

      <form
        onSubmit={onSubmit}
        className="mx-auto flex max-w-4xl items-end gap-1"
      >
        {/* PAPERCLIP */}
        {!isRecording && !hasSelection && (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mb-0.5 shrink-0 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Attach file"
              aria-label="Attach file"
            >
              <Paperclip size={22} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              // ← بدون accept: همه‌ی فایل‌ها مجازند
              className="hidden"
            />
          </>
        )}

        {/* EMOJI */}
        {!isRecording && !hasSelection && (
          <button
            type="button"
            onClick={() => setShowEmoji((v) => !v)}
            className="mb-0.5 shrink-0 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Emoji"
          >
            <Smile size={22} />
          </button>
        )}

        {/* INPUT */}
        {isRecording ? (
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 dark:bg-red-950/30">
            <div className="size-3 animate-pulse rounded-full bg-red-500" />
            <span className="flex-1 text-sm font-medium text-red-600 dark:text-red-400">
              Recording...
            </span>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();

                if (hasSelection) {
                  void uploadAndSendMedia();
                } else if (value.trim()) {
                  event.currentTarget.form?.requestSubmit();
                }
              }
            }}
            rows={1}
            placeholder={
              hasSelection
                ? mediaType === "FILE"
                  ? "Add a caption..."
                  : "Add a caption..."
                : "Message"
            }
            className="scrollbar-hidden max-h-32 min-h-[38px] flex-1 resize-none overflow-y-auto rounded-xl bg-slate-100 px-3 py-2 text-[15px] outline-none transition focus:ring-1 focus:ring-blue-500/50 dark:bg-slate-800 dark:text-white"
          />
        )}

        {/* ACTION BUTTONS */}
        <div className="mb-0.5 flex shrink-0 items-center gap-0.5">
          {hasSelection ? (
            <button
              type="button"
              onClick={uploadAndSendMedia}
              disabled={isUploading}
              className="flex size-9 items-center justify-center rounded-full text-blue-500 hover:bg-blue-50 disabled:opacity-50 dark:hover:bg-slate-800"
              aria-label="Send"
            >
              {isUploading ? (
                <LoaderCircle size={20} className="animate-spin" />
              ) : (
                <Send size={22} />
              )}
            </button>
          ) : isRecording ? (
            <>
              <button
                type="button"
                onClick={cancelRecording}
                disabled={isUploading}
                className="flex size-9 items-center justify-center rounded-full text-red-500 hover:bg-red-50"
                aria-label="Cancel recording"
              >
                <Trash2 size={20} />
              </button>
              <button
                type="button"
                onClick={sendVoiceMessage}
                disabled={isUploading}
                className="flex size-9 items-center justify-center rounded-full text-blue-500 hover:bg-blue-50"
                aria-label="Send voice"
              >
                {isUploading ? (
                  <LoaderCircle size={20} className="animate-spin" />
                ) : (
                  <Send size={22} />
                )}
              </button>
            </>
          ) : value.trim() ? (
            <button
              type="submit"
              disabled={sending}
              className="flex size-9 items-center justify-center rounded-full text-blue-500 hover:bg-blue-50"
              aria-label="Send message"
            >
              <Send size={22} />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="flex size-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Record voice"
            >
              <Mic size={22} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}