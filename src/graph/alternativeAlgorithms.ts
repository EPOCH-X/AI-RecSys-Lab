import type { NormalizedUserProfile } from "../types/graph";
import type { ScoredSong } from "../types/song";

type SparseVector = Map<string, number>;

function addFeature(vec: SparseVector, key: string, value: number): void {
  if (!Number.isFinite(value) || value === 0) return;
  vec.set(key, (vec.get(key) ?? 0) + value);
}

function buildProfileVector(profile: NormalizedUserProfile): SparseVector {
  const vec: SparseVector = new Map();

  for (const genre of profile.genres) addFeature(vec, `genre:${genre}`, 1);
  for (const mood of profile.moods) addFeature(vec, `mood:${mood}`, 1);
  for (const activity of profile.activities) addFeature(vec, `activity:${activity}`, 1);

  if (profile.preferredBpmRange) {
    const [lo, hi] = profile.preferredBpmRange;
    addFeature(vec, "num:bpm", ((lo + hi) / 2) / 200);
  }
  if (profile.energyLevel !== undefined) {
    addFeature(vec, "num:energy", profile.energyLevel / 5);
  }
  return vec;
}

function buildSongVector(song: ScoredSong["song"]): SparseVector {
  const vec: SparseVector = new Map();

  addFeature(vec, `genre:${song.genre}`, 1);
  for (const mood of song.moodTags) addFeature(vec, `mood:${mood}`, 1);
  for (const activity of song.activityTags) addFeature(vec, `activity:${activity}`, 1);
  addFeature(vec, "num:bpm", song.bpm / 200);
  addFeature(vec, "num:energy", song.energyLevel / 5);
  addFeature(vec, "num:lyrics", song.hasLyrics ? 1 : 0);

  return vec;
}

function cosineSimilarity(a: SparseVector, b: SparseVector): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const [, v] of a) normA += v * v;
  for (const [, v] of b) normB += v * v;
  if (normA === 0 || normB === 0) return 0;

  for (const [k, av] of a) {
    const bv = b.get(k);
    if (bv !== undefined) dot += av * bv;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function applyCosineRanking(
  scored: ScoredSong[],
  profile: NormalizedUserProfile,
): ScoredSong[] {
  const pv = buildProfileVector(profile);

  return scored.map((row) => {
    const sim = cosineSimilarity(pv, buildSongVector(row.song));
    return {
      ...row,
      finalScore: sim * 10,
    };
  });
}

function songSimilarity(a: ScoredSong, b: ScoredSong): number {
  const tagsA = new Set<string>([
    `genre:${a.song.genre}`,
    ...a.song.moodTags.map((m) => `mood:${m}`),
    ...a.song.activityTags.map((x) => `activity:${x}`),
  ]);
  const tagsB = new Set<string>([
    `genre:${b.song.genre}`,
    ...b.song.moodTags.map((m) => `mood:${m}`),
    ...b.song.activityTags.map((x) => `activity:${x}`),
  ]);
  const union = new Set<string>([...tagsA, ...tagsB]).size;
  if (union === 0) return 0;
  let inter = 0;
  for (const t of tagsA) {
    if (tagsB.has(t)) inter += 1;
  }
  return inter / union;
}

/**
 * Maximal Marginal Relevance(MMR)로 상위 후보를 다양하게 재정렬한다.
 * - lambda가 높을수록 기존 점수를 더 신뢰
 * - lambda가 낮을수록 다양성 증가
 */
export function applyMmrRerank(
  scored: ScoredSong[],
  options?: { topK?: number; candidatePool?: number; lambda?: number },
): ScoredSong[] {
  const topK = Math.max(1, options?.topK ?? 5);
  const candidatePool = Math.max(topK, options?.candidatePool ?? 25);
  const lambda = Math.max(0, Math.min(1, options?.lambda ?? 0.75));

  const byScore = [...scored].sort((a, b) => b.finalScore - a.finalScore);
  const pool = byScore.slice(0, candidatePool);
  const rest = byScore.slice(candidatePool);
  if (pool.length <= 1) return byScore;

  const selected: ScoredSong[] = [];
  const selectedIndex = new Set<number>();

  while (selected.length < topK && selected.length < pool.length) {
    let bestIdx = -1;
    let bestMmr = Number.NEGATIVE_INFINITY;

    for (let i = 0; i < pool.length; i += 1) {
      if (selectedIndex.has(i)) continue;
      const candidate = pool[i]!;

      let maxSimToSelected = 0;
      for (const picked of selected) {
        maxSimToSelected = Math.max(maxSimToSelected, songSimilarity(candidate, picked));
      }

      const relevance = candidate.finalScore / 10;
      const mmr = lambda * relevance - (1 - lambda) * maxSimToSelected;
      if (mmr > bestMmr) {
        bestMmr = mmr;
        bestIdx = i;
      }
    }

    if (bestIdx < 0) break;
    selectedIndex.add(bestIdx);
    selected.push(pool[bestIdx]!);
  }

  const unselectedPool = pool.filter((_, idx) => !selectedIndex.has(idx));
  return [...selected, ...unselectedPool, ...rest];
}

