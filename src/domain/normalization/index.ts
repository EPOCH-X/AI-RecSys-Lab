import type { AnswerRecord } from "../../types/question";
import type { NormalizedUserProfile } from "../../types/graph";

export function normalizeAnswers(answers: AnswerRecord[]): NormalizedUserProfile {
  const valueFor = (questionId: string) =>
    answers.find((answer) => answer.questionId === questionId && !answer.skipped)?.value;

  const mood = valueFor("mood");
  const activity = valueFor("activity");
  const genre = valueFor("genre");
  const tempo = valueFor("tempo");
  const time = valueFor("time");
  const lyrics = valueFor("lyrics");

  return {
    moods: typeof mood === "string" ? [mood] : [],
    activities: typeof activity === "string" ? [activity] : [],
    genres: typeof genre === "string" ? [genre] : [],
    preferredBpmRange:
      tempo === "slow" ? [60, 85] :
      tempo === "mid" ? [86, 110] :
      tempo === "fast" ? [111, 160] :
      undefined,
    preferredTime: typeof time === "string" ? (time as NormalizedUserProfile["preferredTime"]) : undefined,
    prefersLyrics: lyrics === "true" ? true : lyrics === "false" ? false : undefined
  };
}

/** 자유 서술 질문(`freeTextMood`) 답 — 프로필 타입에는 넣지 않고 LLM 보강 단계에서만 사용 */
export function freeTextMoodFromAnswers(answers: AnswerRecord[]): string | undefined {
  const raw = answers.find((a) => a.questionId === "freeTextMood" && !a.skipped)?.value;
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : undefined;
}

/** 질문 응답 기반 태그 후보 — 협업/컨텍스트 가중에 활용 */
export function preferenceTagsFromProfile(profile: NormalizedUserProfile): string[] {
  const fromLists = [...profile.moods, ...profile.activities, ...profile.genres];
  const extras: string[] = [];
  if (profile.preferredTime) extras.push(profile.preferredTime);
  if (profile.preferredBpmRange) {
    const [lo, hi] = profile.preferredBpmRange;
    if (hi <= 85) extras.push("slow_bpm");
    else if (lo >= 111) extras.push("fast_bpm");
    else extras.push("mid_bpm");
  }
  if (profile.prefersLyrics === false) extras.push("instrumental");
  if (profile.prefersLyrics === true) extras.push("lyrics");
  return [...new Set([...fromLists, ...extras])];
}
