import type { AnswerRecord } from "../../types/question";
import type { NormalizedUserProfile } from "../../types/graph";
import { SITUATION_OPTIONS } from "../tasteConstants";

function bpmRangeFromTempo(
  value: string | string[] | boolean | undefined,
): [number, number] | undefined {
  if (value === "slow") return [60, 85];
  if (value === "mid") return [86, 110];
  if (value === "fast") return [111, 160];
  return undefined;
}

function energyLevelFromValue(
  value: string | string[] | boolean | undefined,
): number | undefined {
  if (value === "low") return 2;
  if (value === "medium") return 3;
  if (value === "high") return 5;
  return undefined;
}

export function normalizeAnswers(
  answers: AnswerRecord[],
): NormalizedUserProfile {
  const valueFor = (questionId: string) =>
    answers.find(
      (answer) => answer.questionId === questionId && !answer.skipped,
    )?.value;

  const mood = valueFor("mood");
  const activity = valueFor("activity");
  const genre = valueFor("genre");
  const tempo = valueFor("tempo");
  const energy = valueFor("energy");

  return {
    moods: typeof mood === "string" ? [mood] : [],
    activities: typeof activity === "string" ? [activity] : [],
    genres: typeof genre === "string" ? [genre] : [],
    tempos: [],
    favoriteArtists: [],
    ageRange: "",
    preferredBpmRange: bpmRangeFromTempo(tempo),
    energyLevel: energyLevelFromValue(energy),
  };
}

/** 자유 서술 질문 답 — 프로필 타입에는 넣지 않고 LLM 보강 단계에서만 사용 */
export function freeTextPreferenceFromAnswers(
  answers: AnswerRecord[],
): string | undefined {
  const raw = answers.find(
    (a) => a.questionId === "freeTextPreference" && !a.skipped,
  )?.value;
  return typeof raw === "string" && raw.trim().length > 0
    ? raw.trim()
    : undefined;
}

/** 질문 응답 기반 태그 후보 — 협업/컨텍스트 가중에 활용 */
export function preferenceTagsFromProfile(
  profile: NormalizedUserProfile,
): string[] {
  const fromLists = [
    ...profile.moods,
    ...profile.activities,
    ...profile.genres,
    ...profile.tempos,
    ...profile.favoriteArtists,
  ];
  if (profile.ageRange) fromLists.push(profile.ageRange);
  const extras: string[] = [];
  if (profile.preferredBpmRange) {
    const [lo, hi] = profile.preferredBpmRange;
    if (hi <= 85) extras.push("slow_bpm");
    else if (lo >= 111) extras.push("fast_bpm");
    else extras.push("mid_bpm");
  }
  if (profile.energyLevel !== undefined) {
    if (profile.energyLevel <= 2) extras.push("low_energy");
    else if (profile.energyLevel >= 5) extras.push("high_energy");
    else extras.push("medium_energy");
  }
  return [...new Set([...fromLists, ...extras])];
}

/** 질문 플로우 없이 API로만 추천받은 경우 결과 화면 요약 */
export function formatRecommendationProfileSummary(
  profile: NormalizedUserProfile | null,
  fallbackTags: string[],
): string {
  if (!profile) {
    return fallbackTags.length > 0
      ? fallbackTags.join(" · ")
      : "저장된 취향 요약이 없습니다.";
  }
  const parts: string[] = [];
  if (profile.genres.length) parts.push(`장르 ${profile.genres.join(", ")}`);
  if (profile.moods.length) parts.push(`분위기 ${profile.moods.join(", ")}`);
  if (profile.tempos.length) parts.push(`템포 ${profile.tempos.join(", ")}`);
  if (profile.favoriteArtists.length) {
    parts.push(`가수 ${profile.favoriteArtists.join(", ")}`);
  }
  if (profile.ageRange) parts.push(`연령 ${profile.ageRange}`);
  const sit = SITUATION_OPTIONS.find((x) => x.value === profile.activities[0]);
  if (sit) parts.push(`상황 ${sit.label}`);
  if (profile.narrative?.trim()) {
    const t = profile.narrative.trim();
    parts.push(
      t.length > 100 ? `요청 ${t.slice(0, 100)}…` : `요청 ${t}`,
    );
  }
  if (parts.length === 0 && fallbackTags.length > 0) {
    return fallbackTags.join(" · ");
  }
  return parts.length > 0 ? parts.join(" · ") : "프로필 요약 없음";
}
