// components/settings/UsernameEditor.tsx
"use client";

import { useEffect, useState } from "react";
import { AtSign, Check, LoaderCircle, X } from "lucide-react";
import { useChat } from "@/lib/chat-context";

export default function UsernameEditor() {
  const { myProfile, updateUsername } = useChat();

  const [value, setValue] = useState(myProfile?.username ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // وقتی myProfile از بیرون آپدیت شد (مثلاً بعد از لاگین)، فرم را هم‌گام کن
  useEffect(() => {
    setValue(myProfile?.username ?? "");
  }, [myProfile?.username]);

  const normalized = value.trim().toLowerCase();
  const original = (myProfile?.username ?? "").toLowerCase();
  const isUnchanged = normalized === original;
  const isValid = /^[a-z0-9_]{3,20}$/.test(normalized);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isValid) {
      setError(
        "Username must be 3–20 characters: lowercase letters, numbers, or underscore."
      );
      return;
    }
    if (isUnchanged) return;

    setSaving(true);
    const result = await updateUsername(normalized);
    setSaving(false);

    if (!result.ok) {
      setError(result.error ?? "Failed to update username.");
      return;
    }
    setSuccess("Username updated successfully.");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="username"
          className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          Username
        </label>

        <div className="relative">
          <AtSign
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            id="username"
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError("");
              setSuccess("");
            }}
            placeholder="your_username"
            maxLength={20}
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>

        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          3–20 characters. Lowercase letters (a–z), numbers (0–9), and
          underscore (_) only. This is how others find and mention you.
        </p>

        {/* نشانگر زنده‌ی اعتبار */}
        {value.trim() && (
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {isValid ? (
              <>
                <Check size={14} className="text-green-600" />
                <span className="text-green-600">Valid format</span>
              </>
            ) : (
              <>
                <X size={14} className="text-red-500" />
                <span className="text-red-500">
                  Invalid format or length
                </span>
              </>
            )}
            {!isUnchanged && (
              <span className="ml-2 text-slate-400">
                → {normalized || "…"}
              </span>
            )}
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          <X size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300"
        >
          <Check size={16} className="mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving || isUnchanged || !isValid}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <LoaderCircle size={16} className="animate-spin" />}
          {saving ? "Saving..." : "Save username"}
        </button>

        {!isUnchanged && !saving && (
          <button
            type="button"
            onClick={() => {
              setValue(myProfile?.username ?? "");
              setError("");
              setSuccess("");
            }}
            className="rounded-lg px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}