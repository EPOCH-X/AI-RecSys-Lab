#!/usr/bin/env node
/**
 * YouTube Data API v3 — 공개 플레이리스트 → src/data/playlists.json
 *
 * .env / .env.local:
 *   YOUTUBE_API_KEY
 *
 * 소스: src/data/playlist-sources.json
 *   각 항목에 youtubePlaylistId 필요 (list= 뒤 ID, 보통 PL… 로 시작)
 *
 * 실행: npm run build:playlists:youtube
 *
 * 선택 환경변수:
 *   YOUTUBE_PLAYLIST_MAX — 플레이리스트당 최대 영상 수 (기본 200, 상한 500)
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SOURCES_PATH = path.join(ROOT, "src/data/playlist-sources.json");
const OUT_PATH = path.join(ROOT, "src/data/playlists.json");

const MAX_ITEMS = Math.min(
  500,
  Math.max(
    1,
    parseInt(process.env.YOUTUBE_PLAYLIST_MAX ?? "200", 10) || 200,
  ),
);

function parseEnvFile(text) {
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    process.env[k] = v;
  }
}

function loadEnvFiles() {
  for (const name of [".env", ".env.local"]) {
    const envPath = path.join(ROOT, name);
    if (!fs.existsSync(envPath)) continue;
    parseEnvFile(fs.readFileSync(envPath, "utf8"));
  }
}

/**
 * YouTube 뮤직/일반 영상 제목에서 artist / title 추정.
 * @param {string} rawTitle
 * @param {string} channelTitle videoOwnerChannelTitle 또는 channelTitle
 */
function guessArtistTitle(rawTitle, channelTitle) {
  let title = (rawTitle ?? "").replace(/\s+/g, " ").trim();
  const channel = (channelTitle ?? "").replace(/\s+/g, " ").trim();

  // 괄호 블록 일부 제거 (공식 MV, lyrics 등) — 과도한 제거는 피함
  title = title.replace(/\s*\((?:official|mv|lyrics|audio|hd)[^)]*\)/gi, "").trim();
  title = title.replace(/\s*\[[^\]]*\]\s*$/i, "").trim();

  const splitters = [" - ", " – ", " — ", " | "];
  for (const sep of splitters) {
    const idx = title.indexOf(sep);
    if (idx > 0 && idx < title.length - sep.length) {
      const a = title.slice(0, idx).trim();
      const b = title.slice(idx + sep.length).trim();
      if (a.length >= 1 && b.length >= 1) {
        // "Artist - Title" 가 더 흔함; 토픽 채널이면 채널과 비교
        const chNorm = channel.replace(/\s*-\s*Topic\s*$/i, "").trim();
        if (chNorm && a.toLowerCase().includes(chNorm.toLowerCase().slice(0, 12))) {
          return { artist: a, title: b };
        }
        if (chNorm && b.toLowerCase().includes(chNorm.toLowerCase().slice(0, 12))) {
          return { artist: b, title: a };
        }
        return { artist: a, title: b };
      }
    }
  }

  // 구분자 없음: 채널명을 아티스트로 (토픽/VEVO 등은 제목만 쓰는 경우 많음)
  const ch = channel.replace(/\s*-\s*Topic\s*$/i, "").trim();
  if (ch && !/^vevo$/i.test(ch)) {
    return { artist: ch, title: title || ch };
  }
  return { artist: "", title: title };
}

/**
 * @param {string} apiKey
 * @param {string} playlistId
 * @returns {Promise<{ artist: string, title: string }[]>}
 */
async function fetchPlaylistItems(apiKey, playlistId) {
  const out = [];
  /** @type {Set<string>} */
  const seen = new Set();
  let pageToken = "";

  for (;;) {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("playlistId", playlistId);
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("key", apiKey);
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`[${playlistId}] ${await res.text()}`);
    }

    const data = await res.json();
    const items = data.items ?? [];

    for (const it of items) {
      const sn = it.snippet;
      if (!sn?.title) continue;
      // 삭제/비공개 플레이스홀더
      if (/^deleted video$/i.test(sn.title) || /^private video$/i.test(sn.title)) {
        continue;
      }
      const channel =
        sn.videoOwnerChannelTitle?.trim() ||
        sn.channelTitle?.trim() ||
        "";
      const { artist, title } = guessArtistTitle(sn.title, channel);
      if (!title) continue;
      const a = artist || "(unknown)";
      const dedupeKey = `${a.toLowerCase()}|${title.toLowerCase()}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      out.push({ artist: a, title });
      if (out.length >= MAX_ITEMS) return out;
    }

    pageToken = data.nextPageToken ?? "";
    if (!pageToken) break;
  }

  return out;
}

async function main() {
  loadEnvFiles();

  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "YOUTUBE_API_KEY 가 없습니다. Google Cloud Console에서 YouTube Data API v3 키를 발급해 .env 또는 .env.local 에 넣으세요.",
    );
  }

  if (!fs.existsSync(SOURCES_PATH)) {
    throw new Error(`없음: ${SOURCES_PATH}`);
  }

  const sources = JSON.parse(fs.readFileSync(SOURCES_PATH, "utf8"));
  const curated = [];

  for (const src of sources) {
    const yid = src.youtubePlaylistId?.trim();
    if (!yid) {
      console.warn("건너뜀 (youtubePlaylistId 없음):", src.id);
      continue;
    }
    console.error(`가져오는 중: ${src.name} (${yid}) …`);
    const tracks = await fetchPlaylistItems(apiKey, yid);
    curated.push({
      id: src.id,
      name: src.name,
      genreHints: src.genreHints ?? [],
      moodHints: src.moodHints ?? [],
      tracks,
    });
    console.error(`  → ${tracks.length}곡`);
  }

  if (!curated.length) {
    throw new Error(
      "생성된 플레이리스트가 없습니다. playlist-sources.json 에 youtubePlaylistId 를 채웠는지 확인하세요.",
    );
  }

  fs.writeFileSync(OUT_PATH, `${JSON.stringify(curated, null, 2)}\n`, "utf8");
  console.error(`저장: ${OUT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
