import type { NormalizedUserProfile } from "@/types/graph";
import type { Song } from "@/types/song";
import { loadCatalogSongsFromJson } from "@/services/songsCatalog.server";

/**
 * 서버(API 라우트)에서만 import 하세요.
 * 곡 목록은 src/data/songs.json 에서만 로드합니다 (외부 검색 API 없음).
 */
export async function fetchSongsForProfile(
  _profile: NormalizedUserProfile,
): Promise<Song[]> {
  return loadCatalogSongsFromJson();
}
