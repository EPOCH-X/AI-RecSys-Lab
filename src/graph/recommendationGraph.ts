import type {
  AppGraphState,
  NormalizedUserProfile,
  RecommendationItem,
} from "../types/graph";
import type { ScoredSong, Song } from "../types/song";
import {
  freeTextPreferenceFromAnswers,
  normalizeAnswers,
  preferenceTagsFromProfile,
} from "../domain/normalization";
import { toRecommendationItems } from "../domain/recommendation";
import { enrichProfileWithFreeText, generateReasons } from "../services/gemini";
import {
  modeUsesMmr,
  parseAlgorithmMode,
  runFullScoringForMode,
} from "./recommendationPipeline";

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
  const algorithmMode = parseAlgorithmMode(
    process.env.NEXT_PUBLIC_RECSYS_ALGO,
  );
  const scored = runFullScoringForMode(songs, profile, algorithmMode);

  let items: RecommendationItem[] = toRecommendationItems(scored, {
    preserveInputOrder: modeUsesMmr(algorithmMode),
  });
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
