import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    // ✅ نمایش پیام دقیق روی صفحه به جای Application error
    if (typeof window !== "undefined") {
      const msg = `Missing Supabase env vars. URL=${url ?? "undefined"} KEY=${key ? "present" : "undefined"}`;
      document.body.innerHTML = `<pre style="color:red;padding:20px;font-size:14px">${msg}</pre>`;
    }
    throw new Error(
      `Missing Supabase environment variables. URL=${url ?? "undefined"}, KEY=${key ? "set" : "unset"}`
    );
  }

  client = createClient(url, key);
  return client;
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const real = getClient() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === "function" ? value.bind(real) : value;
  },
});