"use client";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
type Props = { open: boolean; title: string; onClose: () => void; children: ReactNode };
export default function Modal({ open, title, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
      <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold text-slate-800">{title}</h2><button onClick={onClose} aria-label="Close dialog" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button></div>
      {children}
    </section>
  </div>;
}
