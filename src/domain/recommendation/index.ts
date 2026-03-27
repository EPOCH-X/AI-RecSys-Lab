import type { RecommendationItem } from "../../types/graph";
import type { ScoredSong } from "../../types/song";
/*
scoring>index.ts scoreSongs() 함수 결과를 필터링하자...
finalScore 내림차순 정렬
상위 5개만 선택
추천 이유 문자열 만들기
 */

// matchedTags를 보고 추천 이유를 한 줄로 만드는 함수
function makeReason(matchedTags: string[]): string {
  const reasons: string[] = [];
  // mood 관련
  if (matchedTags.includes("calm")) {
    reasons.push("차분한 분위기와 잘 맞는 곡");
  }

  if (matchedTags.includes("bright")) {
    reasons.push("밝은 무드에 어울리는 곡");
  }

  if (matchedTags.includes("emotional")) {
    reasons.push("감성적인 분위기를 잘 살려주는 곡");
  }

  // activity 관련
  if (matchedTags.includes("study")) {
    reasons.push("집중할 때 듣기 좋은 곡");
  }

  if (matchedTags.includes("workout")) {
    reasons.push("활동적인 상황에 어울리는 곡");
  }

  if (matchedTags.includes("relax")) {
    reasons.push("편하게 쉬고 싶을 때 잘 맞는 곡");
  }

  // context 관련
  if (matchedTags.includes("bpm")) {
    reasons.push("원하는 템포와 잘 맞는 곡");
  }

  if (matchedTags.includes("lyrics")) {
    reasons.push("가사 취향이 반영된 곡");
  }

  if (matchedTags.includes("energy")) {
    reasons.push("원하는 에너지감과 가까운 곡");
  }

  // 협업 필터링 관련
  if (matchedTags.includes("similar-users-liked")) {
    reasons.push("비슷한 취향의 사용자들도 좋아한 곡");
  }

  // 이유가 하나도 없으면 기본 문장
  if (reasons.length === 0) {
    return "사용자 취향을 바탕으로 추천된 곡입니다.";
  }

  // 너무 길어지지 않게 앞에서 2개만 사용
  return reasons.slice(0, 2).join(", ") + "입니다.";
}

export function toRecommendationItems(
  scoredSongs: ScoredSong[],
): RecommendationItem[] {
  return (
    scoredSongs
      // 1) finalScore 높은 순으로 정렬
      .sort((a, b) => b.finalScore - a.finalScore)
      // 2) 상위 5곡만 선택
      .slice(0, 5)
      // 3) RecommendationItem 형태로 변환
      .map((item) => ({
        songId: item.song.id,
        title: item.song.title,
        artist: item.song.artist,
        genre: item.song.genre,
        finalScore: item.finalScore,

        // 곡마다 matchedTags를 보고 추천 이유 생성
        reason: makeReason(item.matchedTags),
        coverUrl: item.song.coverUrl,
        scoreBreakdown: {
          content: item.contentScore,
          collaborative: item.collaborativeScore,
          context: item.contextScore,
        },
      }))
  );
}
