import { getTrackTagNames } from "@/services/lastfm.server";

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
export async function searchTracks(query: string) {
  const res = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=10`,
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
