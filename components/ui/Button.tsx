import type { ButtonHTMLAttributes, ReactNode } from "react";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger" };
const styles = { primary: "bg-sky-600 text-white hover:bg-sky-700", secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200", ghost: "text-slate-600 hover:bg-slate-100", danger: "bg-rose-600 text-white hover:bg-rose-700" };
export default function Button({ children, variant = "primary", className = "", type = "button", ...props }: Props) {
  return <button type={type} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`} {...props}>{children}</button>;
}
