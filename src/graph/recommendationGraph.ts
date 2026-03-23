import type { AppGraphState } from "../types/graph";

export async function runRecommendationGraph(state: AppGraphState): Promise<AppGraphState> {
  return {
    ...state,
    sessionStatus: "done"
  };
}
