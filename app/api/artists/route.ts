import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../lib/catalog";

export async function GET() {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabase
    .from("songs")
    .select("artist")
    .order("artist");

  if (error) {
    return NextResponse.json([]);
  }

  const unique = Array.from(
    new Set((data ?? []).map((r) => r.artist as string).filter(Boolean))
  );

  return NextResponse.json(unique);
}
