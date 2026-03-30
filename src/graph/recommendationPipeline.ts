import type { NormalizedUserProfile } from "../types/graph";
import type { MockUserProfile } from "../types/user";
import type { CuratedPlaylist } from "../types/playlist";
import type { ScoredSong, Song } from "../types/song";
import usersData from "../data/users.json";
import playlistsData from "../data/playlists.json";
import { applyPlaylistBoost } from "../domain/playlist";
import { scoreSongs } from "../domain/scoring";
import { applyCosineRanking, applyMmrRerank } from "./alternativeAlgorithms";

const mockUsers = usersData as MockUserProfile[];
const curatedPlaylists = playlistsData as CuratedPlaylist[];

export type AlgorithmMode =
  | "baseline"
  | "cosine"
  | "cosine_mmr"
  | "hybrid_mmr";

export const ALGORITHM_MODES: AlgorithmMode[] = ["cosine_mmr"];

export const ALGORITHM_COMPARE_LABELS: Record<
  AlgorithmMode,
  { title: string; oneLiner: string; detail: string }
> = {
  baseline: {
    title: "Baseline (A)",
    oneLiner: "규칙 점수 + 가중합",
    detail:
      "콘텐츠·(로컬 ID일 때만) 협업 부스트·플레이리스트·컨텍스트 후 0.5/0.3/0.2 가중합",
  },
  cosine: {
    title: "Cosine (B)",
    oneLiner: "프로필–곡 희소 벡터 코사인",
    detail: "장르·무드·활동·BPM·에너지를 특성으로 두고 코사인 유사도만으로 순위",
  },
  cosine_mmr: {
    title: "Cosine + MMR (B+D)",
    oneLiner: "코사인 후 다양성 재정렬",
    detail: "코사인 점수 상위 풀에서 MMR로 Top-5를 고름 (비슷한 곡 연속 완화)",
  },
  hybrid_mmr: {
    title: "Hybrid + MMR (A+D)",
    oneLiner: "기존 하이브리드 + MMR",
    detail: "Baseline과 동일한 점수 파이프라인 후 MMR로 Top-5 재정렬",
  },
};

export function parseAlgorithmMode(_raw: string | undefined): AlgorithmMode {
  return "cosine_mmr";
}

function maxOrOne(values: number[]): number {
  const m = Math.max(...values, 0);
  return m > 0 ? m : 1;
}

function similarityToMockUser(
  profile: NormalizedUserProfile,
  user: MockUserProfile,
): number {
  const pg = new Set(profile.genres);
  const pm = new Set(profile.moods);
  let s = 0;
  for (const g of user.preferredGenres) {
    if (pg.has(g)) s += 2;
  }
  for (const m of user.preferredMoods) {
    if (pm.has(m)) s += 2;
  }
  return s;
}

function applyCollaborativeBoost(
  scored: ScoredSong[],
  profile: NormalizedUserProfile,
): ScoredSong[] {
  if (mockUsers.length === 0) return scored;

  const catalogFromItunes =
    scored.length > 0 && scored.every((r) => /^\d+$/.test(r.song.id));
  if (catalogFromItunes) {
    return scored;
  }

  const best = mockUsers.reduce(
    (acc, u) => {
      const sim = similarityToMockUser(profile, u);
      return sim > acc.sim ? { sim, user: u } : acc;
    },
    { sim: 0, user: mockUsers[0]! },
  );

  const liked = new Set(best.user.likedSongs);
  const skipped = new Set(best.user.skippedSongs);

  return scored.map((row) => {
    let collaborativeScore = 0;
    if (liked.has(row.song.id)) collaborativeScore += 4;
    if (skipped.has(row.song.id)) collaborativeScore -= 2;
    collaborativeScore += Math.min(best.sim, 3) * 0.5;
    return { ...row, collaborativeScore };
  });
}

function applyContextScores(
  scored: ScoredSong[],
  profile: NormalizedUserProfile,
): ScoredSong[] {
  return scored.map((row) => {
    let contextScore = 0;
    const { song } = row;
    const matchedTags = [...row.matchedTags];

    if (profile.preferredBpmRange) {
      const [lo, hi] = profile.preferredBpmRange;
      if (song.bpm >= lo && song.bpm <= hi) {
        contextScore += 3;
        matchedTags.push("tempo");
      } else if (song.bpm >= lo - 10 && song.bpm <= hi + 10) {
        contextScore += 1;
      }
    }

    if (profile.activities.includes("workout") && song.bpm >= 110)
      contextScore += 2;
    if (profile.activities.includes("relax") && song.energyLevel <= 3)
      contextScore += 1.5;

    if (profile.moods.includes("calm") && song.energyLevel <= 3)
      contextScore += 1;
    if (profile.moods.includes("energetic") && song.energyLevel >= 4)
      contextScore += 1;
    if (
      profile.moods.includes("romantic") &&
      song.moodTags.includes("romantic")
    )
      contextScore += 1.5;

    if (profile.energyLevel !== undefined) {
      const diff = Math.abs(song.energyLevel - profile.energyLevel);
      if (diff === 0) {
        contextScore += 2;
        matchedTags.push("energy");
      } else if (diff === 1) {
        contextScore += 1;
      }
    }

    return { ...row, contextScore, matchedTags: [...new Set(matchedTags)] };
  });
}

function mergeFinalScores(scored: ScoredSong[]): ScoredSong[] {
  const c = scored.map((s) => s.contentScore);
  const col = scored.map((s) => s.collaborativeScore);
  const ctx = scored.map((s) => s.contextScore);
  const maxC = maxOrOne(c);
  const maxCol = maxOrOne(col.map((x) => Math.max(x, 0)));
  const maxCtx = maxOrOne(ctx.map((x) => Math.max(x, 0)));

  return scored.map((row) => {
    const nc = row.contentScore / maxC;
    const nCol = Math.max(row.collaborativeScore, 0) / maxCol;
    const nCtx = Math.max(row.contextScore, 0) / maxCtx;
    const blended = 0.5 * nc + 0.3 * nCol + 0.2 * nCtx;
    return { ...row, finalScore: blended * 10 };
  });
}

/**
 * 동일 카탈로그·프로필에 대해 알고리즘 모드별로만 점수 파이프라인을 실행한다.
 * (카탈로그 fetch, LLM 설명 생성은 호출 측에서 처리)
 */
export function runFullScoringForMode(
  songs: Song[],
  profile: NormalizedUserProfile,
  mode: AlgorithmMode,
): ScoredSong[] {
  let scored = scoreSongs(songs, profile);

  if (mode === "cosine" || mode === "cosine_mmr") {
    scored = applyCosineRanking(scored, profile);
  } else {
    scored = applyCollaborativeBoost(scored, profile);
    scored = applyPlaylistBoost(scored, profile, curatedPlaylists);
    scored = applyContextScores(scored, profile);
    scored = mergeFinalScores(scored);
  }

  const useMmr = mode === "cosine_mmr" || mode === "hybrid_mmr";
  if (useMmr) {
    scored = applyMmrRerank(scored, {
      topK: 5,
      candidatePool: 25,
      lambda: 0.75,
    });
  }

  return scored;
}

export function modeUsesMmr(mode: AlgorithmMode): boolean {
  return mode === "cosine_mmr" || mode === "hybrid_mmr";
}
