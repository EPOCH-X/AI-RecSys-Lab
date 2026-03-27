import type { AnswerRecord } from "./question";
import type { ScoredSong } from "./song";
import type { PreferredTime } from "./user";

export type SessionStatus =
  | "idle"
  | "questioning"
  | "tagging"
  | "recommending"
  | "done"
  | "error";

export interface NormalizedUserProfile {
  moods: string[];
  activities: string[];
  genres: string[];
  preferredBpmRange?: [number, number];
  preferredTime?: PreferredTime;
  prefersLyrics?: boolean;
  energyLevel?: number;
}

export interface RecommendationItem {
  songId: string;
  title: string;
  artist: string;
  genre?: string;
  finalScore: number;
  reason: string;
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
