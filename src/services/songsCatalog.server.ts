import fs from "node:fs";
import path from "node:path";

import type { Song } from "@/types/song";

const SONGS_PATH = path.join(process.cwd(), "src/data/songs.json");

/** songs.json 의 한 행 (semantic 스키마) */
interface RawChartSong {
  id?: number;
  title?: string;
  artist?: { id?: number; name?: string };
  album?: { id?: number; name?: string };
  chart?: { year?: number; bestRank?: number };
  features?: { genre?: string; tempo?: string; mood?: string };
}

function tempoToBpm(label: string): number {
  const t = label.trim().toLowerCase();
  if (/빠름|fast|up|quick/i.test(t)) return 120;
  if (/느림|slow|슬로/i.test(t)) return 72;
  return 95;
}

function moodToEnergy(mood: string): number {
  const m = mood.trim();
  if (/강렬|에너지|격|파워/i.test(m)) return 4;
  if (/감성|잔잔|차분|슬픔/i.test(m)) return 2;
  return 3;
}

function coerceSong(row: unknown): Song | null {
  if (!row || typeof row !== "object") return null;
  const r = row as RawChartSong;
  const id = r.id != null ? String(r.id) : "";
  const title = (r.title ?? "").trim();
  const artist = (r.artist?.name ?? "").trim();
  if (!id || !title || !artist) return null;

  const genre = (r.features?.genre ?? "Unknown").trim() || "Unknown";
  const tempoLabel = (r.features?.tempo ?? "").trim();
  const moodRaw = (r.features?.mood ?? "").trim();
  const bpm = tempoToBpm(tempoLabel || "보통");
  const moodTags = moodRaw ? [moodRaw] : [];
  const energyLevel = moodRaw ? moodToEnergy(moodRaw) : 3;

  return {
    id,
    title,
    artist,
    genre,
    bpm,
    moodTags,
    activityTags: [],
    hasLyrics: true,
    energyLevel,
    chartYear: r.chart?.year,
    chartBestRank: r.chart?.bestRank,
    albumId: r.album?.id != null ? String(r.album.id) : undefined,
    albumTitle: r.album?.name?.trim() || undefined,
    tempoLabel: tempoLabel || undefined,
  };
}

let cache: Song[] | null = null;

/** 서버 전용: src/data/songs.json → Song[] */
export function loadCatalogSongsFromJson(): Song[] {
  if (cache) return cache;
  if (!fs.existsSync(SONGS_PATH)) {
    throw new Error(`곡 데이터가 없습니다: ${SONGS_PATH}`);
  }
  const raw = JSON.parse(fs.readFileSync(SONGS_PATH, "utf8")) as unknown;
  if (!Array.isArray(raw)) {
    throw new Error("songs.json 은 배열이어야 합니다.");
  }
  const out: Song[] = [];
  for (const row of raw) {
    const s = coerceSong(row);
    if (s) out.push(s);
  }
  if (out.length === 0) {
    throw new Error("songs.json 에서 유효한 곡을 찾지 못했습니다.");
  }
  cache = out;
  return out;
}

export function clearSongsCatalogCache(): void {
  cache = null;
}
