import type {
  AppGraphState,
  NormalizedUserProfile,
  RecommendationItem,
} from "../types/graph";
import type { MockUserProfile } from "../types/user";
import type { ScoredSong, Song } from "../types/song";
import type { CuratedPlaylist } from "../types/playlist";
import usersData from "../data/users.json";
import playlistsData from "../data/playlists.json";
import {
  freeTextPreferenceFromAnswers,
  normalizeAnswers,
  preferenceTagsFromProfile,
} from "../domain/normalization";
import { applyPlaylistBoost } from "../domain/playlist";
import { scoreSongs } from "../domain/scoring";
import { toRecommendationItems } from "../domain/recommendation";
import { enrichProfileWithFreeText, generateReasons } from "../services/gemini";

const mockUsers = usersData as MockUserProfile[];
const curatedPlaylists = playlistsData as CuratedPlaylist[];

async function fetchCatalogSongs(
  profile: NormalizedUserProfile,
): Promise<Song[]> {
  const res = await fetch("/api/catalog/songs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  const data = (await res.json()) as { songs?: Song[]; error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "곡 카탈로그를 불러오지 못했습니다.");
  }
  if (!data.songs?.length) {
    throw new Error(
      data.error ?? "검색된 곡이 없습니다. 질문 답변을 조정해 보세요.",
    );
  }
  return data.songs;
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

async function computeRecommendations(state: AppGraphState): Promise<{
  profile: NormalizedUserProfile;
  preferenceTags: string[];
  candidateSongs: ScoredSong[];
  items: RecommendationItem[];
}> {
  let profile = normalizeAnswers(state.answers);
  profile = await enrichProfileWithFreeText(
    profile,
    freeTextPreferenceFromAnswers(state.answers),
  );
  const preferenceTags = preferenceTagsFromProfile(profile);

  const songs = await fetchCatalogSongs(profile);
  let scored = scoreSongs(songs, profile);
  scored = applyCollaborativeBoost(scored, profile);
  scored = applyPlaylistBoost(scored, profile, curatedPlaylists);
  scored = applyContextScores(scored, profile);
  scored = mergeFinalScores(scored);

  let items: RecommendationItem[] = toRecommendationItems(scored);
  items = await generateReasons({
    userProfile: profile,
    recommendations: items,
  });

  return { profile, preferenceTags, candidateSongs: scored, items };
}

export async function runRecommendationGraph(
  state: AppGraphState,
): Promise<AppGraphState> {
  try {
    const { profile, preferenceTags, candidateSongs, items } =
      await computeRecommendations(state);
    return {
      ...state,
      sessionStatus: "done",
      normalizedProfile: profile,
      preferenceTags,
      candidateSongs,
      finalRecommendations: items,
      errorMessage: undefined,
    };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "추천 처리 중 오류가 발생했습니다.";
    return {
      ...state,
      sessionStatus: "error",
      errorMessage: message,
      finalRecommendations: [],
      normalizedProfile: state.normalizedProfile,
      candidateSongs: state.candidateSongs,
      preferenceTags: state.preferenceTags,
    };
  }
}
