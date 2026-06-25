import { NextResponse } from "next/server";
import { BACKEND_URL, getSupabaseServer, mapSongRow, normalizeUrl } from "../../../lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Preferred path: read directly from Supabase (works with backend off).
  const supabase = getSupabaseServer();
  if (supabase) {
    const { data, error } = await supabase
      .from("songs")
      .select("*")
      .eq("job_id", id)
      .maybeSingle();

    if (!error && data) {
      return NextResponse.json(mapSongRow(data));
    }
    // Fall through to backend proxy on error / not found.
  }

  if (!BACKEND_URL) {
    return NextResponse.json({ error: "Backend URL no configurada." }, { status: 500 });
  }

  const response = await fetch(`${BACKEND_URL}/catalog/${id}`, { cache: "no-store" });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: errorText || "Cancion no encontrada." },
      { status: response.status }
    );
  }

  const song = (await response.json()) as Record<string, unknown>;

  return NextResponse.json({
    ...song,
    videoUrl: normalizeUrl(song.videoUrl),
    instrumentalUrl: normalizeUrl(song.instrumentalUrl),
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!BACKEND_URL) {
    return NextResponse.json({ error: "Backend URL no configurada." }, { status: 500 });
  }

  const { id } = await params;
  const adminToken = process.env.ADMIN_TOKEN || "";
  const response = await fetch(`${BACKEND_URL}/catalog/${id}`, {
    method: "DELETE",
    cache: "no-store",
    headers: adminToken ? { "X-Admin-Token": adminToken } : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: errorText || "Error al eliminar la cancion." },
      { status: response.status }
    );
  }

  const payload = (await response.json()) as Record<string, unknown>;
  return NextResponse.json(payload);
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!BACKEND_URL) {
    return NextResponse.json({ error: "Backend URL no configurada." }, { status: 500 });
  }

  const { id } = await params;
  const response = await fetch(`${BACKEND_URL}/catalog/${id}/separate`, {
    method: "POST",
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: errorText || "Error al procesar la instrumental." },
      { status: response.status }
    );
  }

  const payload = (await response.json()) as { instrumental_url: string; [key: string]: unknown };
  return NextResponse.json({
    ...payload,
    instrumental_url: normalizeUrl(payload.instrumental_url),
  });
}
