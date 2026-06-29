import { NextResponse } from "next/server";
import { BACKEND_URL, getSupabaseServer, mapSongRow, normalizeUrl } from "../../lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)));
  const search = searchParams.get("search")?.trim() ?? "";
  const offset = (page - 1) * limit;

  // Preferred path: read directly from Supabase so the catalog loads even when
  // the heavy backend is turned off.
  const supabase = getSupabaseServer();
  if (supabase) {
    let query = supabase
      .from("songs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`title.ilike.%${search}%,artist.ilike.%${search}%`);
    }
    const tag = searchParams.get("tag")?.trim() ?? "";
    if (tag) {
      query = query.contains("tags", [tag]);
    }

    const { data, error, count } = await query;

    if (!error && data) {
      return NextResponse.json({
        songs: data.map(mapSongRow),
        total: count ?? 0,
        page,
        limit,
      });
    }
    // On error, fall through to the backend proxy below.
  }

  // Fallback: proxy the backend (used when Supabase env vars are not set).
  // Backend fallback returns all songs without server-side pagination.
  if (!BACKEND_URL) {
    return NextResponse.json({ error: "Backend URL no configurada." }, { status: 500 });
  }

  const backendUrl = new URL(`${BACKEND_URL}/catalog`);
  if (search) backendUrl.searchParams.set("search", search);

  const response = await fetch(backendUrl.toString(), { cache: "no-store" });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: errorText || "Error al cargar el catalogo." },
      { status: response.status }
    );
  }

  const payload = (await response.json()) as Array<Record<string, unknown>>;
  const allSongs = payload.map((song) => ({
    ...song,
    videoUrl: normalizeUrl(song.videoUrl),
    instrumentalUrl: normalizeUrl(song.instrumentalUrl),
  }));

  return NextResponse.json({
    songs: allSongs.slice(offset, offset + limit),
    total: allSongs.length,
    page,
    limit,
  });
}
