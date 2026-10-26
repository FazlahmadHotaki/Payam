// lib/supabase/client.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables.");
  }

  client = createClient(url, key);
  return client;
}

// Proxy: هر جا `supabase.xxx` صدا زده شود، کلاینت واقعی در همان لحظه ساخته می‌شود.
// در زمان build یا prerender (که هنوز چیزی صدا زده نشده) هیچ throw ای رخ نمی‌دهد.
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const real = getClient() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === "function" ? value.bind(real) : value;
  },
});