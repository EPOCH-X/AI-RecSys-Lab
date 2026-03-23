import type { ScoredSong, Song } from "../../types/song";
import type { NormalizedUserProfile } from "../../types/graph";

export function scoreSongs(songs: Song[], profile: NormalizedUserProfile): ScoredSong[] {
  return songs.map((song) => {
    const matchedTags = [
      ...song.moodTags.filter((tag) => profile.moods.includes(tag)),
      ...song.activityTags.filter((tag) => profile.activities.includes(tag))
    ];

    const genreScore = profile.genres.includes(song.genre) ? 3 : 0;
    const moodScore = song.moodTags.filter((tag) => profile.moods.includes(tag)).length * 2;
    const activityScore = song.activityTags.filter((tag) => profile.activities.includes(tag)).length * 2;
    const contentScore = genreScore + moodScore + activityScore;

    return {
      song,
      contentScore,
      collaborativeScore: 0,
      contextScore: 0,
      finalScore: contentScore,
      matchedTags
    };
  });
}
