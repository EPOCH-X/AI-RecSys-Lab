import type { NormalizedUserProfile } from "@/types/graph";
import type { Song } from "@/types/song";
import {
  ITUNES_SEARCH_DEFAULT_LIMIT,
  ITUNES_SEARCH_MAX_LIMIT,
  enrichTrackWithTags,
  mapItunesTrack,
} from "@/services/itunes.server";

/**
 * 서버(API 라우트)에서만 import 하세요. iTunes + Last.fm 호출을 한곳에 모읍니다.
 */

const ACTIVITY_HINTS: Record<string, string[]> = {
  study: ["study", "focus", "chill", "ambient", "instrumental", "acoustic"],
  workout: ["workout", "running", "gym", "dance", "upbeat", "energetic"],
  relax: ["relax", "chill", "calm", "slow"],
  commute: ["commute", "indie", "pop", "road"],
};

const MOOD_KEYWORDS: [RegExp, string][] = [
  [/chill|calm|mellow|ambient|slow/i, "calm"],
  [/energy|upbeat|dance|party|happy|summer/i, "energetic"],
  [/sad|melanch|emotional|romantic|heart/i, "emotional"],
  [/comfort|warm|soft|heal/i, "comforting"],
];

function tagsToMoodTags(raw: string[], profileMoods: string[]): string[] {
  const out = new Set<string>(profileMoods.map((m) => m.toLowerCase()));
  for (const t of raw) {
    const lower = t.toLowerCase();
    for (const [re, mood] of MOOD_KEYWORDS) {
      if (re.test(lower)) out.add(mood);
    }
    if (lower.length <= 24) out.add(lower);
  }
  return [...out].slice(0, 14);
}

function tagsToActivityTags(raw: string[], profileActivities: string[]): string[] {
  const out = new Set<string>(profileActivities);
  const blob = raw.join(" ").toLowerCase();
  for (const act of ["study", "workout", "relax", "commute"] as const) {
    if (ACTIVITY_HINTS[act].some((h) => blob.includes(h))) out.add(act);
  }
  if (out.size === 0) out.add("relax");
  return [...out];
}

function estimateBpmAndEnergy(
  tags: string[],
  genreLabel: string,
): { bpm: number; energyLevel: number } {
  const t = tags.join(" ").toLowerCase() + genreLabel.toLowerCase();
  let bpm = 100;
  if (/slow|ballad|ambient|chill|acoustic/.test(t)) bpm = 74;
  if (/fast|punk|hard|drum|techno|edm/.test(t)) bpm = 132;
  if (/medium|pop|indie|r&b|soul/.test(t)) bpm = 96;
  let energyLevel = 3;
  if (bpm < 82) energyLevel = 2;
  if (bpm < 72) energyLevel = 1;
  if (bpm > 118) energyLevel = 4;
  if (bpm > 130) energyLevel = 5;
  return { bpm, energyLevel };
}

function largerArtwork(url: string): string {
  return url.replace(/100x100bb/gi, "300x300bb");
}

export function enrichedTrackToSong(
  enriched: {
    id: string;
    title: string;
    artist: string;
    imageUrl?: string;
    tags: string[];
  },
  profile: NormalizedUserProfile,
): Song {
  const tagsLower = enriched.tags.map((t) => t.toLowerCase());
  const genre =
    profile.genres[0] ??
    (enriched.tags[0]
      ? enriched.tags[0]!.charAt(0).toUpperCase() + enriched.tags[0]!.slice(1)
      : "Unknown");
  const { bpm, energyLevel } = estimateBpmAndEnergy(tagsLower, genre);
  const moodTags = tagsToMoodTags(enriched.tags, profile.moods);
  const activityTags = tagsToActivityTags(enriched.tags, profile.activities);

  return {
    id: enriched.id,
    title: enriched.title,
    artist: enriched.artist,
    genre,
    bpm,
    moodTags,
    activityTags,
    hasLyrics: true,
    energyLevel,
    coverUrl: enriched.imageUrl ? largerArtwork(enriched.imageUrl) : undefined,
  };
}

function searchQueriesFromProfile(profile: NormalizedUserProfile): string[] {
  const q: string[] = [];
  const g0 = profile.genres[0] ?? "pop";
  for (const g of profile.genres) {
    q.push(`${g} music`);
  }
  for (const m of profile.moods) {
    q.push(`${m} ${g0}`);
  }
  for (const a of profile.activities) {
    q.push(`${a} music ${g0}`);
  }
  if (q.length === 0) q.push("chart pop");
  return [...new Set(q)].slice(0, 6);
}

export async function searchItunesEnriched(query: string, limit: number) {
  const res = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=${limit}`,
  );

  if (!res.ok) {
    throw new Error("iTunes 검색 실패");
  }

  const data = (await res.json()) as { results?: unknown[] };
  const rows = data.results ?? [];
  const tracks = rows.map((r) => mapItunesTrack(r));
  return Promise.all(tracks.map((t) => enrichTrackWithTags(t)));
}

export async function fetchSongsForProfile(
  profile: NormalizedUserProfile,
  options?: { perQuery?: number },
): Promise<Song[]> {
  const perQuery = Math.min(
    ITUNES_SEARCH_MAX_LIMIT,
    Math.max(5, options?.perQuery ?? ITUNES_SEARCH_DEFAULT_LIMIT),
  );
  const queries = searchQueriesFromProfile(profile);
  const merged = new Map<string, Song>();

  for (const query of queries) {
    const enriched = await searchItunesEnriched(query, perQuery);
    for (const row of enriched) {
      const id = String(row.id ?? "");
      if (!id || merged.has(id)) continue;
      merged.set(id, enrichedTrackToSong(row, profile));
    }
  }

  return [...merged.values()];
}
