import Link from "next/link";
import { ArrowLeft, MessageCircle, ShieldCheck, Users } from "lucide-react";
export default function AboutPage() {
  return <main className="min-h-dvh bg-slate-50 p-5 sm:p-10"><div className="mx-auto max-w-2xl"><Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-900"><ArrowLeft size={17} /> Back to chats</Link>
    <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10"><div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-sky-100 text-sky-700"><MessageCircle size={28} /></div><h1 className="text-3xl font-bold text-slate-900">About Telechat</h1><p className="mt-3 leading-7 text-slate-600">Telechat is a Telegram-inspired messaging interface built with Next.js, React, TypeScript, and Tailwind CSS.</p>
    <div className="mt-8 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-slate-50 p-4"><Users className="mb-3 text-sky-600" /><h2 className="font-semibold">Conversations</h2><p className="mt-1 text-sm leading-6 text-slate-500">Browse demo contacts and switch between chats.</p></div><div className="rounded-2xl bg-slate-50 p-4"><ShieldCheck className="mb-3 text-sky-600" /><h2 className="font-semibold">Demo privacy</h2><p className="mt-1 text-sm leading-6 text-slate-500">Messages are local UI state; no backend is connected.</p></div></div><Link href="/" className="mt-8 inline-flex rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700">Open Telechat</Link></div>
  </div></main>;
}
