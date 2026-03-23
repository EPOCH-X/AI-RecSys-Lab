export type PreferredTime = "morning" | "afternoon" | "evening" | "night";

export interface MockUserProfile {
  id: string;
  preferredGenres: string[];
  preferredMoods: string[];
  preferredTime: PreferredTime;
  likedSongs: string[];
  skippedSongs: string[];
}
