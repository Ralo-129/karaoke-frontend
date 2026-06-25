import { NextResponse } from "next/server";
import { BACKEND_URL, getSupabaseServer, mapSongRow, normalizeUrl } from "../../lib/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  // Preferred path: read directly from Supabase so the catalog loads even when
  // the heavy backend is turned off.
  const supabase = getSupabaseServer();
  if (supabase) {
    const { data, error } = await supabase
      .from("songs")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      return NextResponse.json(data.map(mapSongRow));
    }
    // On error, fall through to the backend proxy below.
  }

  // Fallback: proxy the backend (used when Supabase env vars are not set).
  if (!BACKEND_URL) {
    return NextResponse.json({ error: "Backend URL no configurada." }, { status: 500 });
  }

  const response = await fetch(`${BACKEND_URL}/catalog`, { cache: "no-store" });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: errorText || "Error al cargar el catalogo." },
      { status: response.status }
    );
  }

  const payload = (await response.json()) as Array<Record<string, unknown>>;

  return NextResponse.json(
    payload.map((song) => ({
      ...song,
      videoUrl: normalizeUrl(song.videoUrl),
      instrumentalUrl: normalizeUrl(song.instrumentalUrl),
    }))
  );
}
