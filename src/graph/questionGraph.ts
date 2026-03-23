import type { AppGraphState } from "../types/graph";

export function createInitialGraphState(): AppGraphState {
  return {
    sessionId: crypto.randomUUID(),
    sessionStatus: "idle",
    currentQuestionIndex: 0,
    answers: [],
    preferenceTags: [],
    normalizedProfile: null,
    candidateSongs: [],
    finalRecommendations: [],
    isSkipped: false
  };
}
