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
export function scoreSongs(
  songs: Song[],
  profile: NormalizedUserProfile,
): ScoredSong[] {
  return songs.map((song) => {
    // ----------------------------
    // 1) 사용자와 겹치는 태그 찾기
    // ----------------------------
    // 나중에 "왜 이 곡이 추천됐는지" 설명할 때 사용할 수 있다.
    const matchedTags = [
      ...song.moodTags.filter((tag) => profile.moods.includes(tag)),
      ...song.activityTags.filter((tag) => profile.activities.includes(tag)),
    ];

    // ----------------------------
    // 2) 장르 점수
    // ----------------------------
    // 사용자가 선호하는 장르와 곡 장르가 같으면 +3점
    const genreScore = profile.genres.includes(song.genre) ? 3 : 0;

    // ----------------------------
    // 3) mood 점수
    // ----------------------------
    // 곡의 moodTags 중 사용자 mood와 겹치는 개수 × 2점
    const moodScore =
      song.moodTags.filter((tag) => profile.moods.includes(tag)).length * 2;

    // ----------------------------
    // 4) activity 점수
    // ----------------------------
    // 곡의 activityTags 중 사용자 활동과 겹치는 개수 × 2점
    const activityScore =
      song.activityTags.filter((tag) => profile.activities.includes(tag))
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
