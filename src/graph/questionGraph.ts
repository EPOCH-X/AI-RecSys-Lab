import type { AppGraphState } from "../types/graph";

export function createInitialGraphState(): AppGraphState {
  return {
    sessionStatus: "idle",
    preferenceTags: [],
    normalizedProfile: null,
    candidateSongs: [],
    finalRecommendations: [],
  };
}
