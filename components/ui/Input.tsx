import type { InputHTMLAttributes } from "react";
type Props = InputHTMLAttributes<HTMLInputElement> & { label?: string };
export default function Input({ label, id, className = "", ...props }: Props) {
  const inputId = id ?? props.name;
  return <label className="block w-full">{label && <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>}
    <input id={inputId} className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 ${className}`} {...props} />
  </label>;
}
