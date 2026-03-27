import type { AnswerRecord } from "../../types/question";
import type { NormalizedUserProfile } from "../../types/graph";

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
  ];
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
