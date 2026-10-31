// components/settings/AvatarUploader.tsx
"use client";

import { useRef, useState } from "react";
import { Camera, LoaderCircle } from "lucide-react";
import { useChat } from "@/lib/chat-context";
import { displayName } from "@/lib/chat";

export default function AvatarUploader() {
  const { myProfile, updateAvatar } = useChat();

  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const name = myProfile ? displayName(myProfile) : "Payam User";
  const initial = name.charAt(0).toUpperCase();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError("");
    setSuccess(false);
    setUploading(true);

    const res = await updateAvatar(file);

    setUploading(false);

    if (!res.ok) {
      setError(res.error || "Upload failed. Please try again.");
      return;
    }

    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar + camera button */}
      <div className="relative">
        {myProfile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={myProfile.avatar_url}
            alt={name}
            className="size-24 rounded-full object-cover ring-4 ring-blue-500/10"
          />
        ) : (
          <div className="flex size-24 items-center justify-center rounded-full bg-blue-600 text-3xl font-semibold text-white ring-4 ring-blue-500/10">
            {initial}
          </div>
        )}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          aria-label="Change avatar"
          title="Change avatar"
          className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-md transition hover:bg-blue-700 disabled:opacity-60 dark:border-slate-900"
        >
          {uploading ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <Camera size={16} />
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {/* Name + username */}
      <div className="text-center">
        <p className="text-sm font-medium text-slate-900 dark:text-white">
          {name}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          @{myProfile?.username || "username"}
        </p>
      </div>

      {/* Feedback */}
      {error && (
        <p className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-xs text-green-600 dark:text-green-400">
          Avatar updated successfully.
        </p>
      )}
    </div>
  );
}