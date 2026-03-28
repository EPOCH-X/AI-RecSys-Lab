import type { NormalizedUserProfile, RecommendationItem } from "../../types/graph";
import type { ScoredSong, Song } from "../../types/song";
import { SITUATION_OPTIONS } from "../tasteConstants";
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

  if (matchedTags.includes("energetic")) {
    reasons.push("에너지 있는 분위기에 어울리는 곡");
  }

  if (matchedTags.includes("emotional")) {
    reasons.push("감성적인 분위기를 잘 살려주는 곡");
  }

  if (matchedTags.includes("comforting")) {
    reasons.push("편안하고 위로되는 무드에 잘 맞는 곡");
  }

  if (matchedTags.includes("romantic")) {
    reasons.push("로맨틱한 분위기를 살려주는 곡");
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
  if (matchedTags.includes("tempo")) {
    reasons.push("원하는 템포와 잘 맞는 곡");
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

function genresMatchProfileSong(
  profile: NormalizedUserProfile,
  song: Song,
): boolean {
  return profile.genres.some(
    (g) =>
      g.toLowerCase() === song.genre.toLowerCase() ||
      song.genre.toLowerCase().includes(g.toLowerCase()) ||
      g.toLowerCase().includes(song.genre.toLowerCase()),
  );
}

function genreLabelForBadge(
  profile: NormalizedUserProfile,
  song: Song,
): string {
  return (
    profile.genres.find(
      (g) =>
        g.toLowerCase() === song.genre.toLowerCase() ||
        song.genre.toLowerCase().includes(g.toLowerCase()) ||
        g.toLowerCase().includes(song.genre.toLowerCase()),
    ) ?? song.genre
  );
}

/** 질문naire + scoreSongs 기반: 입력과 맞아떨어진 항목만 뱃지용 */
function tasteMatchTagsFromQuestionnaire(
  profile: NormalizedUserProfile,
  song: Song,
  matchedTags: string[],
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (s: string) => {
    const t = s.trim();
    if (t && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  };

  if (genresMatchProfileSong(profile, song)) {
    add(genreLabelForBadge(profile, song));
  }

  for (const tag of matchedTags) {
    if (tag === "tempo") {
      const range = profile.preferredBpmRange;
      if (range) {
        const [lo, hi] = range;
        if (hi <= 85) add("느림");
        else if (lo >= 111) add("빠름");
        else add("보통");
      }
    } else if (tag === "energy") {
      continue;
    } else if (song.moodTags.includes(tag)) {
      add(tag);
    } else {
      const sit = SITUATION_OPTIONS.find((s) => s.value === tag);
      if (sit) add(sit.label);
    }
  }

  return out;
}

export function toRecommendationItems(
  scoredSongs: ScoredSong[],
  profile: NormalizedUserProfile,
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
        tasteMatchTags: tasteMatchTagsFromQuestionnaire(
          profile,
          item.song,
          item.matchedTags,
        ),
        coverUrl: item.song.coverUrl,
        scoreBreakdown: {
          content: item.contentScore,
          collaborative: item.collaborativeScore,
          context: item.contextScore,
        },
      }))
  );
}
