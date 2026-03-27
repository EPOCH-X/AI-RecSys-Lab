import { NextResponse } from "next/server";
import type { NormalizedUserProfile } from "@/types/graph";
import { fetchSongsForProfile } from "@/services/catalog.server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { profile?: NormalizedUserProfile };
  try {
    body = (await req.json()) as { profile?: NormalizedUserProfile };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const profile = body.profile;
  if (!profile || typeof profile !== "object") {
    return NextResponse.json({ error: "missing_profile" }, { status: 400 });
  }

  try {
    const songs = await fetchSongsForProfile(profile);
    if (songs.length === 0) {
      return NextResponse.json(
        { error: "no_songs", songs: [] },
        { status: 422 },
      );
    }
    return NextResponse.json({ songs });
  } catch (e) {
    console.error("[catalog/songs]", e);
    const message =
      e instanceof Error ? e.message : "카탈로그 조회에 실패했습니다.";
    return NextResponse.json({ error: message, songs: [] }, { status: 502 });
  }
}
