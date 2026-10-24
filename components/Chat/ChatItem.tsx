"use client";

import { MessageCircle } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  active: boolean;
  onClick: () => void;
};

export default function ChatItem({ title, subtitle, active, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 border-b border-slate-100 p-3 text-left transition hover:bg-blue-50 dark:border-slate-800 dark:hover:bg-slate-800 ${
        active ? "bg-blue-50 dark:bg-slate-800" : ""
      }`}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
        {title.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{title}</p>
        {subtitle && (
          <p className="truncate text-xs text-slate-500">{subtitle}</p>
        )}
      </div>
      <MessageCircle size={17} className="shrink-0 text-blue-500" />
    </button>
  );
}