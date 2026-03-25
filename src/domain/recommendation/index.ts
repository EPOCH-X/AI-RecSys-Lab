import type { RecommendationItem } from "../../types/graph";
import type { ScoredSong } from "../../types/song";
/*
scoring>index.ts scoreSongs() 함수 결과를 필터링하자...
finalScore 내림차순 정렬
상위 5개만 선택
추천 이유 문자열 만들기
 */

export function toRecommendationItems(
  scoredSongs: ScoredSong[],
): RecommendationItem[] {
  return scoredSongs
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 5)
    .map((item) => ({
      songId: item.song.id,
      title: item.song.title,
      artist: item.song.artist,
      finalScore: item.finalScore,
      reason: "선호 태그와 현재 상황을 기준으로 우선 추천된 곡입니다.",
      scoreBreakdown: {
        content: item.contentScore,
        collaborative: item.collaborativeScore,
        context: item.contextScore,
      },
    }));
}
