import type { ScoredSong, Song } from "../../types/song";
import type { NormalizedUserProfile } from "../../types/graph";
import users from "../../data/users.json";
import type { MockUserProfile } from "../../types/user";

// “이 노래가 사용자 취향 + 상황에 얼마나 잘 맞는지 점수로 계산하는 함수”
/*
 * 사용자 취향(profile)과 곡 정보(song)를 비교해서
 * 각 곡의 점수를 계산하는 함수
 *
 * - contentScore: 취향 기반 점수 (장르, mood, 활동)
 * - contextScore: 상황 기반 점수 (bpm, 가사, 에너지)
 * - finalScore: 최종 점수 (둘을 합침)
노래 1개
↓
취향 비교 → contentScore
↓
상황 비교 → contextScore
↓
합치기 → finalScore
↓
결과 반환
 */
// 두 배열에서 겹치는 항목 개수 세는 함수
function countOverlap(arr1: string[], arr2: string[]) {
  return arr1.filter((item) => arr2.includes(item)).length;
}

// 현재 사용자(profile)와 가상 유저(user)가 얼마나 비슷한지 계산
/*
점수 기준:
장르 겹침: 개당 2점
mood 겹침: 개당 2점
시간대 같으면: 1점
*/
function getUserSimilarity(
  profile: NormalizedUserProfile,
  user: MockUserProfile,
) {
  const genreOverlap = countOverlap(profile.genres, user.preferredGenres);
  const moodOverlap = countOverlap(profile.moods, user.preferredMoods);
  const timeScore = profile.preferredTime === user.preferredTime ? 1 : 0;

  return genreOverlap * 2 + moodOverlap * 2 + timeScore;
}

/**
 * 사용자 취향(profile)과 곡 정보(song)를 비교해서
 * 각 곡의 점수를 계산하는 함수
 *
 * - contentScore: 취향 기반 점수 (장르, mood, 활동)
 * - collaborativeScore: 비슷한 유저들이 좋아한 곡 점수
 * - contextScore: 상황 기반 점수 (bpm, 가사, 에너지)
 * - finalScore: 최종 점수
 */
export function scoreSongs(
  songs: Song[],
  profile: NormalizedUserProfile,
): ScoredSong[] {
  return songs.map((song) => {
    // 1) 사용자와 겹치는 태그 저장 (추천 이유로 사용됨)
    const matchedTags = [
      ...song.moodTags.filter((tag) => profile.moods.includes(tag)),
      ...song.activityTags.filter((tag) => profile.activities.includes(tag)),
    ];

    // ----------------------------
    // 2️) 콘텐츠 기반 점수 (취향)
    // ----------------------------

    // 장르가 일치하면 +3점
    const genreScore = profile.genres.includes(song.genre) ? 3 : 0;

    // mood 태그 겹치는 개수 × 2점
    const moodScore =
      song.moodTags.filter((tag) => profile.moods.includes(tag)).length * 2;

    // 활동 태그 겹치는 개수 × 2점
    const activityScore =
      song.activityTags.filter((tag) => profile.activities.includes(tag))
        .length * 2;

    // 콘텐츠 기반 총 점수
    const contentScore = genreScore + moodScore + activityScore;

    // ----------------------------
    // 3️) 상황 기반 점수 (context)
    // ----------------------------

    // BPM 점수 (템포 범위 안이면 +2점)
    let bpmScore = 0;
    if (profile.preferredBpmRange) {
      const [minBpm, maxBpm] = profile.preferredBpmRange;
      if (song.bpm >= minBpm && song.bpm <= maxBpm) {
        bpmScore = 2;
      }
    }

    // 가사 유무 점수 (원하는 조건과 같으면 +1점)
    let lyricsScore = 0;
    if (profile.prefersLyrics !== undefined) {
      if (song.hasLyrics === profile.prefersLyrics) {
        lyricsScore = 1;
      }
    }

    // 에너지 레벨 점수 (차이가 적을수록 점수 높음)
    let energyScore = 0;
    if (profile.energyLevel !== undefined) {
      const diff = Math.abs(song.energyLevel - profile.energyLevel);

      if (diff === 0) {
        energyScore = 2;
      } else if (diff === 1) {
        energyScore = 1;
      }
    }

    // 상황 기반 총 점수
    const contextScore = bpmScore + lyricsScore + energyScore;
    // ----------------------------
    // 4) 협업 필터링 점수
    // ----------------------------
    let collaborativeScore = 0;

    for (const user of users as MockUserProfile[]) {
      const similarity = getUserSimilarity(profile, user);

      // 비슷한 유저가 이 곡을 좋아하면 similarity만큼 점수 추가
      if (similarity > 0 && user.likedSongs.includes(song.id)) {
        collaborativeScore += similarity;
      }

      // 비슷한 유저가 이 곡을 스킵했으면 약간 감점
      if (similarity > 0 && user.skippedSongs.includes(song.id)) {
        collaborativeScore -= 1;
      }
    }

    // ----------------------------
    // 5) 매칭된 조건 태그 추가 (추천 이유 강화)
    // ----------------------------

    if (bpmScore > 0) matchedTags.push("bpm");
    if (lyricsScore > 0) matchedTags.push("lyrics");
    if (energyScore > 0) matchedTags.push("energy");
    if (collaborativeScore > 0) matchedTags.push("similar-users-liked");

    // ----------------------------
    // 최종 점수
    // ----------------------------

    const finalScore = contentScore + collaborativeScore + contextScore;

    // ----------------------------
    // 결과 반환
    // ----------------------------

    return {
      song, // 원본 노래 데이터
      contentScore, // 취향 기반 점수
      collaborativeScore, //협업 필터링 점수
      contextScore, // 상황 기반 점수
      finalScore, // 최종 점수
      matchedTags, // 추천 이유
    };
  });
}
