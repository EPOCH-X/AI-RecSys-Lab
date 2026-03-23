import type { NormalizedUserProfile, RecommendationItem } from "../types/graph";

export interface ReasoningInput {
  userProfile: NormalizedUserProfile;
  recommendations: RecommendationItem[];
}

export async function generateReasons(input: ReasoningInput): Promise<RecommendationItem[]> {
  return input.recommendations;
}
