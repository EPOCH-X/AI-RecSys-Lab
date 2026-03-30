import type { RecommendationItem } from "../types/graph";

export interface CompareMetrics {
  topK: number;
  distinctGenres: number;
  distinctArtists: number;
  avgFinalScore: number;
}

export function summarizeRecommendations(
  items: RecommendationItem[],
): CompareMetrics {
  const genres = new Set(
    items.map((i) => (i.genre ?? "").trim()).filter(Boolean),
  );
  const artists = new Set(items.map((i) => i.artist.trim()).filter(Boolean));
  const avg =
    items.length === 0
      ? 0
      : items.reduce((s, i) => s + i.finalScore, 0) / items.length;
  return {
    topK: items.length,
    distinctGenres: genres.size,
    distinctArtists: artists.size,
    avgFinalScore: Math.round(avg * 100) / 100,
  };
}
