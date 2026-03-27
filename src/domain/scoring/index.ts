import type { ScoredSong, Song } from "../../types/song";
import type { NormalizedUserProfile } from "../../types/graph";

/**
 * 사용자 취향(profile)과 곡 정보(song)를 비교해서
 * 각 곡의 "기본 취향 점수(contentScore)"를 계산하는 함수
 *
 * 이 함수에서 하는 일
 * 1. 장르가 맞는지 확인
 * 2. mood 태그가 얼마나 겹치는지 확인
 * 3. activity 태그가 얼마나 겹치는지 확인
 * 4. 나중에 추천 이유로 쓸 matchedTags 저장
 *
 * 이 함수에서 아직 하지 않는 일
 * - collaborativeScore 계산
 * - contextScore 계산
 * - finalScore 정규화 / 가중합
 *
 * 위 3가지는 graph 단계에서 후처리로 담당한다.
 */
function matchesList(tag: string, values: string[]): boolean {
  const t = tag.toLowerCase();
  return values.some(
    (v) =>
      v.toLowerCase() === t ||
      t.includes(v.toLowerCase()) ||
      v.toLowerCase().includes(t),
  );
}

export function scoreSongs(
  songs: Song[],
  profile: NormalizedUserProfile,
): ScoredSong[] {
  return songs.map((song) => {
    const matchedTags = [
      ...song.moodTags.filter((tag) => matchesList(tag, profile.moods)),
      ...song.activityTags.filter((tag) =>
        matchesList(tag, profile.activities),
      ),
    ];

    const genreScore = profile.genres.some(
      (g) =>
        g.toLowerCase() === song.genre.toLowerCase() ||
        song.genre.toLowerCase().includes(g.toLowerCase()) ||
        g.toLowerCase().includes(song.genre.toLowerCase()),
    )
      ? 3
      : 0;

    const moodScore =
      song.moodTags.filter((tag) => matchesList(tag, profile.moods)).length * 2;

    const activityScore =
      song.activityTags.filter((tag) => matchesList(tag, profile.activities))
        .length * 2;

    // ----------------------------
    // 5) 기본 취향 점수(contentScore)
    // ----------------------------
    const contentScore = genreScore + moodScore + activityScore;

    // ----------------------------
    // 6) 결과 반환
    // ----------------------------
    // collaborativeScore, contextScore는
    // graph 단계에서 다시 계산할 예정이므로 여기서는 0으로 둔다.
    // finalScore도 일단 contentScore를 초기값으로 넣어둔다.
    return {
      song,
      contentScore,
      collaborativeScore: 0,
      contextScore: 0,
      finalScore: contentScore,
      matchedTags,
    };
  });
}
