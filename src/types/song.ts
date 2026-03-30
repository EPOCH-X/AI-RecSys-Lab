export interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
  bpm: number;
  moodTags: string[];
  activityTags: string[];
  hasLyrics: boolean;
  energyLevel: number;
  coverUrl?: string;
  /** songs.json 차트 메타 — 순위·앨범 가점 등에 사용 */
  chartYear?: number;
  chartBestRank?: number;
  albumId?: string;
  albumTitle?: string;
  /** 원본 템포 라벨 (예: 빠름/보통/느림) */
  tempoLabel?: string;
}

export interface ScoredSong {
  song: Song;
  contentScore: number;
  collaborativeScore: number;
  contextScore: number;
  finalScore: number;
  matchedTags: string[];
}
