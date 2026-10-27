// components/stories/StoryCreator.tsx
"use client";

import { useRef, useState } from "react";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { useChat } from "@/lib/chat-context";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function StoryCreator({ open, onClose }: Props) {
  const { createStory } = useChat();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError("");
  };

  const reset = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setCaption("");
    setError("");
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Please select a photo or video.");
      return;
    }
    setUploading(true);
    setError("");
    const res = await createStory(file, caption);
    setUploading(false);
    if (!res.ok) {
      setError(res.error ?? "Upload failed");
      return;
    }
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3">
      <div className="relative w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-xl dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            New Story
          </h2>
          <button
            onClick={() => {
              reset();
              onClose();
            }}
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-2.5 p-3">
          {/* Preview / Picker */}
          {preview ? (
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-black">
              {file?.type.startsWith("video/") ? (
                <video
                  src={preview}
                  className="h-full w-full object-contain"
                  controls
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Preview"
                  className="h-full w-full object-contain"
                />
              )}
              <button
                onClick={() => {
                  if (preview) URL.revokeObjectURL(preview);
                  setPreview(null);
                  setFile(null);
                }}
                className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                aria-label="Remove preview"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-400 dark:hover:text-blue-400"
            >
              <ImagePlus size={32} />
              <span className="text-xs">Select photo or video</span>
            </button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={onPick}
          />

          {/* Caption */}
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption (optional)"
            rows={2}
            maxLength={200}
            className="w-full resize-none rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={uploading || !file}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {uploading && <LoaderCircle size={14} className="animate-spin" />}
            {uploading ? "Posting..." : "Share Story"}
          </button>
        </div>
      </div>
    </div>
  );
}