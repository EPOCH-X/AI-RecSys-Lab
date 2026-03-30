export type RecommendationMode = "simple" | "detailed";

/** 클라이언트 → POST /api/recommend */
export interface RecommendRequestBody {
  mode: RecommendationMode;
  /** simple: 필수 */
  narrative?: string;
  /** detailed: 객관식 (가수·템포는 선택, 생략 시 템포 무관) */
  genre?: string;
  mood?: string;
  tempo?: string;
  artist?: string;
  /** 둘 다 필수 */
  ageRange: string;
  /** SITUATION_OPTIONS 의 value */
  situation: string;
}
