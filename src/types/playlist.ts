/**
 * 큐레이션 플레이리스트: JSON 또는 YouTube 등 스크립트로 채웁니다.
 * 카탈로그 곡은 trackId가 달라도 artist+title 키로 매칭합니다.
 */
export interface PlaylistTrackRef {
  artist: string;
  title: string;
}

export interface CuratedPlaylist {
  id: string;
  name: string;
  /** 프로필 장르와 겹치면 이 플레이리스트 가중(빈 배열이면 장르 필터 없음) */
  genreHints?: string[];
  /** 프로필 무드와 겹치면 가중 */
  moodHints?: string[];
  /** 직접 아는 iTunes `trackId`가 있으면 추가 */
  itunesTrackIds?: string[];
  /** 아티스트·제목으로 매칭 */
  tracks?: PlaylistTrackRef[];
}
