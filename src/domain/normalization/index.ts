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
