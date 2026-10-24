// lib/chat.ts

export type Profile = {
  id: string;
  display_name: string | null;
  email: string | null;
  username?: string | null; // <-- Added for unique usernames
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export type Conversation = {
  id: string;
  otherUser: Profile;
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
export function displayName(profile: Profile): string {
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
export function relativeTime(iso?: string): string {
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