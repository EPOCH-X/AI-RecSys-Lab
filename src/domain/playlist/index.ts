import type { NormalizedUserProfile } from "../../types/graph";
import type { CuratedPlaylist } from "../../types/playlist";
import type { ScoredSong, Song } from "../../types/song";

/** 트랙 키: 소문자, 공백 축약 */
export function trackMatchKey(artist: string, title: string): string {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/\([^)]*\)/g, " ")
      .replace(/[^a-z0-9\s가-힣]/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  return `${norm(artist)}|${norm(title)}`;
}

function hintsOverlap(hints: string[] | undefined, values: string[]): number {
  if (!hints?.length) return 0;
  let s = 0;
  for (const h of hints) {
    const hl = h.toLowerCase();
    for (const v of values) {
      const vl = v.toLowerCase();
      if (vl === hl || vl.includes(hl) || hl.includes(vl)) {
        s += 2;
        break;
      }
    }
  }
  return s;
}

/**
 * 프로필과 플레이리스트 메타의 적합도(0 이상). 높을수록 이 플레이리스트 가산을 더 신뢰.
 */
export function playlistProfileRelevance(
  playlist: CuratedPlaylist,
  profile: NormalizedUserProfile,
): number {
  let score = hintsOverlap(playlist.genreHints, profile.genres);
  score += hintsOverlap(playlist.moodHints, profile.moods) * 0.75;
  if (!playlist.genreHints?.length && !playlist.moodHints?.length) {
    return 1;
  }
  return score > 0 ? score : 0;
}

function buildPlaylistKeySets(playlists: CuratedPlaylist[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const pl of playlists) {
    const keys = new Set<string>();
    for (const id of pl.itunesTrackIds ?? []) {
      if (id) keys.add(`id:${id}`);
    }
    for (const t of pl.tracks ?? []) {
      keys.add(trackMatchKey(t.artist, t.title));
    }
    map.set(pl.id, keys);
  }
  return map;
}

function songKeys(song: Song): Set<string> {
  const keys = new Set<string>();
  keys.add(`id:${song.id}`);
  keys.add(trackMatchKey(song.artist, song.title));
  return keys;
}

/**
 * 플레이리스트 공출현 스타일 가산: 프로필에 맞는 플레이리스트에 들어 있으면 collaborativeScore에 더합니다.
 */
export function applyPlaylistBoost(
  scored: ScoredSong[],
  profile: NormalizedUserProfile,
  playlists: CuratedPlaylist[],
  options?: { boostPerHit?: number },
): ScoredSong[] {
  if (!playlists.length) return scored;
  const boostUnit = options?.boostPerHit ?? 2.5;
  const plKeys = buildPlaylistKeySets(playlists);

  return scored.map((row) => {
    let add = 0;
    const skeys = songKeys(row.song);
    for (const pl of playlists) {
      const relevance = playlistProfileRelevance(pl, profile);
      if (relevance <= 0) continue;
      const set = plKeys.get(pl.id);
      if (!set?.size) continue;
      let hit = false;
      for (const k of skeys) {
        if (set.has(k)) {
          hit = true;
          break;
        }
      }
      if (hit) {
        add += boostUnit * Math.min(relevance, 6);
      }
    }
    return {
      ...row,
      collaborativeScore: row.collaborativeScore + add,
    };
  });
}
