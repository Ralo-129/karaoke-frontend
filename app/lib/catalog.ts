import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Backend URL (used as a fallback when Supabase is not configured, and to
// resolve any legacy relative file URLs).
export const BACKEND_URL = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  ""
).replace(/\/+$/, "");

let cachedClient: SupabaseClient | null | undefined;

/**
 * Server-side Supabase client used by the API routes to read the catalog
 * directly from Supabase (so browsing/playing works even when the heavy
 * backend is turned off). Returns null when env vars are not configured, in
 * which case the routes fall back to proxying the backend.
 */
export function getSupabaseServer(): SupabaseClient | null {
  if (cachedClient !== undefined) return cachedClient;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  cachedClient =
    url && key
      ? createClient(url, key, { auth: { persistSession: false } })
      : null;

  return cachedClient;
}

export const normalizeUrl = (value: unknown): string | undefined => {
  if (typeof value !== "string" || !value) return undefined;
  if (value.startsWith("http")) return value;
  // Legacy relative URL (/uploads/... or /files/...): resolve against backend.
  return BACKEND_URL ? `${BACKEND_URL}${value}` : value;
};

type SongRow = Record<string, unknown>;

/**
 * Maps a raw `songs` table row (snake_case) to the camelCase shape the frontend
 * expects. Note the public "id" is the job_id (matches the backend's to_public).
 */
export const mapSongRow = (row: SongRow) => ({
  id: row.job_id,
  title: row.title,
  artist: row.artist,
  bpm: row.bpm ?? 0,
  duration: row.duration,
  lrcPreview: row.lrc_preview,
  lrc: row.lrc,
  tags: row.tags ?? [],
  videoUrl: normalizeUrl(row.video_url),
  instrumentalUrl: normalizeUrl(row.instrumental_url),
  status: row.status,
});
