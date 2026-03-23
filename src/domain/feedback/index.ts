export type FeedbackValue = "like" | "dislike";

export interface FeedbackEntry {
  songId: string;
  value: FeedbackValue;
  createdAt: string;
}

export function createFeedbackEntry(songId: string, value: FeedbackValue): FeedbackEntry {
  return {
    songId,
    value,
    createdAt: new Date().toISOString()
  };
}
