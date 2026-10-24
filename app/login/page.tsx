// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { LoaderCircle, MessageCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name },
          },
        });

        if (error) throw error;

        if (!data.session) {
          setMessage(
            "Account created! Check your email to confirm your account, then sign in."
          );
        } else {
          // Fixed: Redirect to Home, not /realtime
          router.push("/");
          router.refresh();
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Fixed: Redirect to Home, not /realtime
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 dark:bg-slate-950">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex flex-col items-center text-center">
          {/* Payam Logo */}
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg">
            <MessageCircle size={32} />
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Payam
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {isSignUp
              ? "Create your account to start messaging."
              : "Welcome back! Sign in to continue."}
          </p>
        </div>

        {isSignUp && (
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Display name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={60}
              autoComplete="name"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-900/50"
              placeholder="Your name"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-900/50"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-900/50"
            placeholder="At least 6 characters"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {message && (
          <p role="status" className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? (
            <>
              <LoaderCircle className="mr-2 animate-spin" size={18} />
              Please wait...
            </>
          ) : isSignUp ? (
            "Create account"
          ) : (
            "Sign in"
          )}
        </button>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          {isSignUp ? "Already have an account?" : "New to Payam?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
              setMessage("");
            }}
            className="font-semibold text-blue-600 hover:underline"
          >
            {isSignUp ? "Sign in" : "Create account"}
          </button>
        </p>
      </form>
    </main>
  );
}