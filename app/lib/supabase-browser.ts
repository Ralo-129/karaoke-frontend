"use client";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Singleton browser client — used for Realtime subscriptions in client components.
// Returns null when env vars are not configured (falls back to polling).
export const supabaseBrowser =
  url && key ? createClient(url, key) : null;
