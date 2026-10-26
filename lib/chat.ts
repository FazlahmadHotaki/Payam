// lib/chat.ts

export type Profile = {
  id: string;
  display_name: string | null;
  email: string | null;
  username?: string | null;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;

  // ← جدید: soft delete (برای «Delete for everyone»)
  deleted_at?: string | null;
  deleted_by?: string | null;
};

export type Conversation = {
  id: string;
  otherUser: Profile;

  // برای مرتب‌سازی و پیش‌نمایش پیام آخر
  lastMessageAt?: string | null;
  lastMessage?: string | null;
  lastMessageSenderId?: string | null;

  // legacy (قبلاً استفاده می‌شد؛ حالا معمولاً null است)
  updatedAt?: string;
};

/**
 * Turn any thrown value into a readable string.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error || "An unknown error occurred.");
}

/**
 * Prefer display_name, fall back to username, then email.
 */
export function displayName(profile: Profile | null | undefined): string {
  if (!profile) return "Payam User";
  return (
    profile.display_name?.trim() ||
    profile.username ||
    profile.email ||
    "Payam User"
  );
}

/**
 * Human-friendly time distance from now.
 */
export function relativeTime(iso?: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const diff = Math.max(0, Math.floor((Date.now() - then) / 1000));

  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86_400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604_800) return `${Math.floor(diff / 86_400)}d`;

  return new Date(iso).toLocaleDateString();
}