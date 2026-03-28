import { loadCatalogSongsFromJson } from "@/services/songsCatalog.server";

/** 로컬 songs.json 로드 여부 확인용 (개발용) */
export async function GET() {
  const songs = loadCatalogSongsFromJson();
  return Response.json({
    count: songs.length,
    sample: songs.slice(0, 3).map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
    })),
  });
}
