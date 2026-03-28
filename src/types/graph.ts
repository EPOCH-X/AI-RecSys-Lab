import type { AnswerRecord } from "./question";
import type { ScoredSong } from "./song";

export type SessionStatus =
  | "idle"
  | "questioning"
  | "tagging"
  | "recommending"
  | "done"
  | "error";

export interface NormalizedUserProfile {
  /** 한글 분위기 라벨 (예: 감성, 밝음) */
  moods: string[];
  /** 듣는 상황 키 (study, workout, …) */
  activities: string[];
  /** 한글 장르 */
  genres: string[];
  /** 한글 템포 (느림/보통/빠름), 빈 배열이면 템포 무관 */
  tempos: string[];
  favoriteArtists: string[];
  ageRange: string;
  preferredBpmRange?: [number, number];
  energyLevel?: number;
  /** simple 모드 원문 */
  narrative?: string;
  recommendationMode?: "simple" | "detailed";
}

export interface RecommendationItem {
  songId: string;
  title: string;
  artist: string;
  genre?: string;
  finalScore: number;
  reason: string;
  /** 가점 요인 한 줄 요약(큰 가중치 순). API 파이프라인에서 채움 */
  fitFactors?: string[];
  coverUrl?: string;
  scoreBreakdown: {
    content: number;
    collaborative: number;
    context: number;
  };
}

export interface AppGraphState {
  sessionId: string;
  sessionStatus: SessionStatus;
  currentQuestionIndex: number;
  answers: AnswerRecord[];
  preferenceTags: string[];
  normalizedProfile: NormalizedUserProfile | null;
  candidateSongs: ScoredSong[];
  finalRecommendations: RecommendationItem[];
  isSkipped: boolean;
  errorMessage?: string;
}
