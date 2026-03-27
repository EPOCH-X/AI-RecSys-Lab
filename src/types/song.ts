export interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
  bpm: number;
  moodTags: string[];
  activityTags: string[];
  hasLyrics: boolean;
  energyLevel: number;
  /** iTunes artwork 등 */
  coverUrl?: string;
}

export interface ScoredSong {
  song: Song;
  contentScore: number;
  collaborativeScore: number;
  contextScore: number;
  finalScore: number;
  matchedTags: string[];
}
