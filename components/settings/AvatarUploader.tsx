// components/settings/AvatarUploader.tsx
"use client";

import { useRef, useState } from "react";
import { Camera, LoaderCircle, User } from "lucide-react";
import { useChat } from "@/lib/chat-context";
import { displayName } from "@/lib/chat";

export default function AvatarUploader() {
  const { myProfile, updateAvatar } = useChat();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  const avatarUrl = preview ?? myProfile?.avatar_url ?? null;
  const initial = myProfile
    ? displayName(myProfile).charAt(0).toUpperCase()
    : "?";

  const handleClick = () => fileInputRef.current?.click();

  const handleFile = async (file: File) => {
    setError("");
    setUploading(true);

    // پیش‌نمایش فوری
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    const result = await updateAvatar(file);
    setUploading(false);

    if (!result.ok) {
      setError(result.error ?? "Upload failed");
      setPreview(null);
    } else {
      setPreview(null); // myProfile از context آپدیت شده
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = ""; // reset
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="group relative cursor-pointer"
        onClick={handleClick}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt="Profile avatar"
            className="h-24 w-24 rounded-full object-cover shadow-md"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-4xl font-bold text-white shadow-md">
            {initial}
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition group-hover:opacity-100">
          {uploading ? (
            <LoaderCircle size={28} className="animate-spin text-white" />
          ) : (
            <Camera size={28} className="text-white" />
          )}
        </div>

        {/* Loading overlay during upload */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
            <LoaderCircle size={28} className="animate-spin text-white" />
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      <button
        type="button"
        onClick={handleClick}
        disabled={uploading}
        className="text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50 dark:text-blue-400"
      >
        {uploading ? "Uploading..." : avatarUrl ? "Change photo" : "Upload photo"}
      </button>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      <p className="text-[11px] text-slate-400 dark:text-slate-500">
        JPG, PNG, WebP or GIF · max 5 MB
      </p>
    </div>
  );
}