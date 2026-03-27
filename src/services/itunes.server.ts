import { getTrackTagNames } from "@/services/lastfm.server";

/** Apple iTunes Search API: `limit` 상한(문서 기준 최대 200). */
export const ITUNES_SEARCH_MAX_LIMIT = 200;
/** 검색당 기본 곡 수(Apple 허용 최대 200). Last.fm 태그는 곡마다 호출되므로 응답이 길어질 수 있습니다. */
export const ITUNES_SEARCH_DEFAULT_LIMIT = 200;

export function clampItunesSearchLimit(n: number): number {
  return Math.min(ITUNES_SEARCH_MAX_LIMIT, Math.max(1, Math.floor(n)));
}

// iTunes 원본 track 데이터를 우리 프로젝트용 구조로 바꾸는 함수
export function mapItunesTrack(track: any) {
  return {
    // 곡 고유 id
    id: String(track.trackId ?? ""),

    // 곡 제목
    title: track.trackName ?? "",

    // 가수 이름
    artist: track.artistName ?? "",

    // 앨범 이름
    album: track.collectionName ?? "",

    // 앨범 이미지
    imageUrl: track.artworkUrl100 ?? "",

    // 곡 상세 링크
    trackUrl: track.trackViewUrl ?? "",

    // 미리듣기 링크
    previewUrl: track.previewUrl ?? null,
  };
}

// iTunes 곡 1개에 Last.fm 태그를 붙이는 함수
export async function enrichTrackWithTags(track: any) {
  const tags = await getTrackTagNames(track.title, track.artist);

  return {
    ...track,
    tags,
  };
}
// -----

// iTunes에서 곡 검색 후, Last.fm 태그까지 붙여서 반환
export async function searchTracks(
  query: string,
  limit: number                         = ITUNES_SEARCH_DEFAULT_LIMIT,
) {
  const lim = clampItunesSearchLimit(limit);
  const res = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=${lim}`,
  );

  if (!res.ok) {
    throw new Error("iTunes 검색 실패");
  }

  const data = await res.json();

  // 1차 전처리: iTunes 원본 데이터를 우리 구조로 변환
  const tracks = data.results.map(mapItunesTrack);

  // 2차 전처리: 각 곡에 Last.fm 태그 붙이기
  const enrichedTracks = await Promise.all(tracks.map(enrichTrackWithTags));

  return enrichedTracks;
}
