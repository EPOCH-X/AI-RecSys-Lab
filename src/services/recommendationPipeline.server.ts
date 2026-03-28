import type { NormalizedUserProfile, RecommendationItem } from "@/types/graph";
import type { RecommendRequestBody } from "@/types/recommendRequest";
import type { Song } from "@/types/song";
import {
  isExplicitTempoChoice,
  isTasteTempo,
  SITUATION_OPTIONS,
  TASTE_GENRES,
  TASTE_MOODS,
  TASTE_TEMPOS,
  TEMPO_NONE_VALUE,
} from "@/domain/tasteConstants";
import { preferenceTagsFromProfile } from "@/domain/normalization";
import { callGeminiJson } from "@/services/gemini";
import { loadCatalogSongsFromJson } from "@/services/songsCatalog.server";

const STAGE1_SHORTLIST = 100;
const FINAL_N = 5;

function situationLabel(value: string): string {
  return SITUATION_OPTIONS.find((s) => s.value === value)?.label ?? value;
}

function pickAllowedStrings(
  raw: unknown,
  allowed: readonly string[],
): string[] {
  if (!Array.isArray(raw)) return [];
  const set = new Set(allowed);
  const out: string[] = [];
  for (const v of raw) {
    if (typeof v === "string" && set.has(v) && !out.includes(v)) out.push(v);
  }
  return out;
}

function pickStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((s) => s.trim())
    .filter((s, i, a) => a.indexOf(s) === i)
    .slice(0, 12);
}

function uniqStrings(values: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of values) {
    const s = v.trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function isPlainRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** LLM이 반환한 객체 → 허용 목록 필터 + 가수 문자열 정리 */
function normalizeNarrativeLlmOutput(o: Record<string, unknown>): {
  genres: string[];
  moods: string[];
  tempos: string[];
  favoriteArtists: string[];
} {
  return {
    genres: pickAllowedStrings(o.genres, TASTE_GENRES),
    moods: pickAllowedStrings(o.moods, TASTE_MOODS),
    tempos: pickAllowedStrings(o.tempos, TASTE_TEMPOS),
    favoriteArtists: pickStringArray(o.favoriteArtists),
  };
}

/**
 * 서술 모드: 구조화 입력은 **Gemini JSON 한 번**이 정본.
 * API 키 없음·응답 파싱 실패·비 JSON 객체일 때만 휴리스틱 폴백.
 */
function narrativeStructuredExtractionPrompt(userText: string): string {
  return `역할: 사용자의 한국어(혹은 혼용) 음악 요청을 추천 파이프라인용 **고정 스키마 JSON**으로만 바꿉니다.

반드시 아래 키 네 개만 가진 JSON 객체 **한 개**만 출력하세요. 설명·마크다운·코드펜스 금지.

스키마:
{
  "genres": string[],
  "moods": string[],
  "tempos": string[],
  "favoriteArtists": string[]
}

규칙:
1) genres: 아래 목록에 있는 문자열만 **그대로** 넣습니다. 해당 없으면 [].
   목록: ${JSON.stringify(TASTE_GENRES)}
2) moods: 아래 목록에 있는 문자열만 **그대로** 넣습니다. 해당 없으면 [].
   목록: ${JSON.stringify(TASTE_MOODS)}
3) tempos: 아래 목록에 있는 문자열만 **그대로** 넣습니다. 해당 없으면 [].
   목록: ${JSON.stringify(TASTE_TEMPOS)}
4) favoriteArtists: 문장에 **직접 언급된** 가수·그룹·뮤지션 이름만 넣습니다. 철자는 문장과 동일하게. 없으면 [].

예시 (출력은 오직 JSON):
입력: "아이유 노래 듣고 싶어요"
출력: {"genres":[],"moods":[],"tempos":[],"favoriteArtists":["아이유"]}

입력: "밤에 잔잔한 발라드 듣고 싶어요"
출력: {"genres":["발라드"],"moods":["잔잔함"],"tempos":[],"favoriteArtists":[]}

입력: "BTS처럼 빠른 댄스곡 추천"
출력: {"genres":["댄스"],"moods":[],"tempos":["빠름"],"favoriteArtists":["BTS"]}

이제 처리할 입력 한 줄:
${JSON.stringify(userText)}`;
}

/** "아이유 노래…", "BTS의 노래" 등 — LLM 실패 시에만 사용 */
function heuristicArtistsFromNarrative(text: string): string[] {
  const raw = text.trim();
  if (!raw) return [];

  const block = new Set<string>([
    ...TASTE_MOODS,
    ...TASTE_GENRES,
    ...TASTE_TEMPOS,
    "신나는",
    "잔잔한",
    "좋은",
    "슬픈",
    "편한",
    "조용한",
    "신나",
    "이런",
    "그런",
    "어떤",
    "내가",
    "우리",
    "지금",
    "오늘",
    "내일",
    "한번",
    "조금",
    "정말",
    "너무",
    "같이",
    "혼자",
    "싶은",
    "듣고",
    "좋아하는",
    "원하는",
    "추천",
    "많이",
    "같은",
    "다른",
    "비슷한",
    "요즘",
  ]);

  const found: string[] = [];

  const reNoraes = /(?:^|[\s,.!?])[「『"']?([\uAC00-\uD7A3a-zA-Z][\uAC00-\uD7A3a-zA-Z0-9·]{0,22}?)[」』"']?\s*(?:의\s*)?노래/gu;
  for (const m of raw.matchAll(reNoraes)) {
    const name = m[1]?.trim();
    if (name && name.length >= 2 && !block.has(name)) found.push(name);
  }

  const reGasu = /(?:가수|아티스트)\s*[는은이가]?\s*([\uAC00-\uD7A3a-zA-Z][\uAC00-\uD7A3a-zA-Z0-9·]{1,22})/gu;
  for (const m of raw.matchAll(reGasu)) {
    const name = m[1]?.trim();
    if (name && name.length >= 2 && !block.has(name)) found.push(name);
  }

  return uniqStrings(found);
}

function heuristicFromNarrative(text: string): {
  genres: string[];
  moods: string[];
  tempos: string[];
  favoriteArtists: string[];
} {
  const genres = TASTE_GENRES.filter((g) => text.includes(g));
  const moods = TASTE_MOODS.filter((m) => text.includes(m));
  const tempos = TASTE_TEMPOS.filter((t) => text.includes(t));
  return {
    genres: [...new Set(genres)],
    moods: [...new Set(moods)],
    tempos: [...new Set(tempos)],
    favoriteArtists: [],
  };
}

async function extractMusicalFromNarrative(
  narrative: string,
): Promise<{
  genres: string[];
  moods: string[];
  tempos: string[];
  favoriteArtists: string[];
}> {
  const trimmed = narrative.trim();
  if (!trimmed) {
    return { genres: [], moods: [], tempos: [], favoriteArtists: [] };
  }

  const parsed = await callGeminiJson(
    narrativeStructuredExtractionPrompt(trimmed),
  );

  if (isPlainRecord(parsed)) {
    return normalizeNarrativeLlmOutput(parsed);
  }

  const heurBase = heuristicFromNarrative(trimmed);
  const heurArtists = heuristicArtistsFromNarrative(trimmed);
  return {
    genres: heurBase.genres,
    moods: heurBase.moods,
    tempos: heurBase.tempos,
    favoriteArtists: heurArtists,
  };
}

async function buildProfile(body: RecommendRequestBody): Promise<NormalizedUserProfile> {
  const base: NormalizedUserProfile = {
    moods: [],
    activities: [body.situation],
    genres: [],
    tempos: [],
    favoriteArtists: [],
    ageRange: body.ageRange.trim(),
    recommendationMode: body.mode,
  };

  if (body.mode === "detailed") {
    return {
      ...base,
      genres: body.genre?.trim() ? [body.genre.trim()] : [],
      moods: body.mood?.trim() ? [body.mood.trim()] : [],
      tempos:
        isExplicitTempoChoice(body.tempo) && isTasteTempo(body.tempo!.trim())
          ? [body.tempo!.trim()]
          : [],
      favoriteArtists: body.artist?.trim() ? [body.artist.trim()] : [],
    };
  }

  const narrative = body.narrative?.trim() ?? "";
  const extracted = await extractMusicalFromNarrative(narrative);
  return {
    ...base,
    narrative,
    genres: extracted.genres,
    moods: extracted.moods,
    tempos: extracted.tempos,
    favoriteArtists: extracted.favoriteArtists,
  };
}

function artistMatches(songArtist: string, needle: string): boolean {
  const a = songArtist.toLowerCase().replace(/\s+/g, "");
  const n = needle.toLowerCase().replace(/\s+/g, "");
  return n.length >= 1 && (a === n || a.includes(n));
}

function stage1MusicalScore(
  song: Song,
  profile: NormalizedUserProfile,
  narrative?: string,
): { score: number; matched: string[] } {
  let score = 0.01;
  const matched: string[] = [];

  if (profile.genres.length) {
    if (profile.genres.some((g) => g === song.genre)) {
      score += 12;
      matched.push("genre");
    }
  }

  for (const m of profile.moods) {
    if (song.moodTags.some((t) => t === m)) {
      score += 7;
      matched.push("mood");
    }
  }

  for (const t of profile.tempos) {
    if (song.tempoLabel && song.tempoLabel === t) {
      score += 6;
      matched.push("tempo");
    }
  }

  const artistFromProfile = profile.favoriteArtists.some((art) =>
    artistMatches(song.artist, art),
  );

  let artistFromNarrative = false;
  if (
    !artistFromProfile &&
    narrative &&
    narrative.length >= 2 &&
    song.artist.trim().length >= 2
  ) {
    const n = narrative.replace(/\s+/g, "");
    const a = song.artist.replace(/\s+/g, "");
    artistFromNarrative = n.includes(a);
  }

  if (artistFromProfile || artistFromNarrative) {
    score += 14;
    matched.push("artist");
  }

  if (narrative && narrative.length >= 2) {
    if (narrative.includes(song.title)) {
      score += 5;
      matched.push("title_mention");
    }
  }

  return { score, matched };
}

function chartRankBonus(song: Song): number {
  const r = song.chartBestRank;
  if (r == null || r < 1) return 0;
  if (r <= 10) return 8;
  if (r <= 40) return 5;
  if (r <= 100) return 3;
  if (r <= 200) return 1;
  return 0;
}

function albumClusterBonus(
  song: Song,
  counts: Map<string, number>,
): number {
  if (!song.albumId) return 0;
  const c = counts.get(song.albumId) ?? 0;
  if (c >= 3) return 4;
  if (c >= 2) return 2;
  return 1;
}

async function llmAgeSituationDeltas(
  candidates: Song[],
  profile: NormalizedUserProfile,
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (candidates.length === 0) return out;

  const situation = situationLabel(profile.activities[0] ?? "");
  const payload = candidates.map((s) => ({
    songId: s.id,
    title: s.title,
    artist: s.artist,
    genre: s.genre,
    moods: s.moodTags,
    tempo: s.tempoLabel ?? null,
  }));

  const prompt = `음악 추천 2차 조정입니다. 후보 곡마다 나이대와 듣는 상황에 얼마나 맞는지 델타 점수를 부여합니다.

사용자 연령대: ${profile.ageRange}
듣는 상황: ${situation}

후보 곡 (JSON):
${JSON.stringify(payload)}

반드시 이 형태의 JSON만 출력:
{ "adjustments": [ { "songId": "<문자열>", "delta": <정수> } ] }
규칙:
- delta는 -5 이상 5 이하 정수.
- 입력의 모든 songId를 정확히 한 번씩 포함.
- 가사 톤, 에너지, 상황 적합성을 고려.`;

  const parsed = await callGeminiJson(prompt);
  if (!parsed || typeof parsed !== "object") return out;
  const adj = (parsed as { adjustments?: unknown }).adjustments;
  if (!Array.isArray(adj)) return out;

  for (const row of adj) {
    if (!row || typeof row !== "object") continue;
    const o = row as { songId?: unknown; delta?: unknown };
    if (typeof o.songId !== "string") continue;
    const d =
      typeof o.delta === "number" && Number.isFinite(o.delta)
        ? Math.round(o.delta)
        : 0;
    out.set(o.songId, Math.min(5, Math.max(-5, d)));
  }

  for (const s of candidates) {
    if (!out.has(s.id)) out.set(s.id, 0);
  }
  return out;
}

type ScoredRow = {
  song: Song;
  stage1: number;
  llmDelta: number;
  chart: number;
  album: number;
  raw: number;
  matched: string[];
};

/** 큰 가중치부터 사용자에게 보여 줄 선정 요인 (숫자 노출 없음) */
function buildFitFactors(row: ScoredRow): string[] {
  const keys = [...new Set(row.matched)];
  type Ent = { pri: number; label: string };
  const ents: Ent[] = [];

  for (const k of keys) {
    if (k === "artist") ents.push({ pri: 100, label: "가수명 일치" });
    if (k === "genre") ents.push({ pri: 90, label: "장르 일치" });
    if (k === "mood") ents.push({ pri: 80, label: "분위기 일치" });
    if (k === "tempo") ents.push({ pri: 70, label: "템포 일치" });
    if (k === "title_mention")
      ents.push({ pri: 60, label: "요청에 곡 제목이 언급됨" });
  }

  if (row.llmDelta > 0) {
    ents.push({
      pri: 45 + row.llmDelta,
      label: "연령·듣는 상황에 맞게 보정됨",
    });
  }

  if (row.chart > 0) {
    let label = "차트 정보 반영";
    if (row.chart >= 8) label = "차트 상위권 반영";
    else if (row.chart >= 5) label = "차트 순위 반영";
    else if (row.chart >= 3) label = "차트 기록 반영";
    ents.push({ pri: 50 + row.chart, label });
  }

  if (row.album > 0) {
    let label = "앨범 정보 반영";
    if (row.album >= 4) label = "같은 앨범 내 인기 곡 다수 반영";
    else if (row.album >= 2) label = "앨범 단위 가점";
    ents.push({ pri: 30 + row.album, label });
  }

  if (ents.length === 0) {
    return ["종합 점수로 상위 후보에서 선정됨"];
  }

  ents.sort((a, b) => b.pri - a.pri);
  return ents.map((e) => e.label);
}

export async function runRecommendationPipeline(body: RecommendRequestBody): Promise<{
  profile: NormalizedUserProfile;
  preferenceTags: string[];
  items: RecommendationItem[];
}> {
  const allSongs = loadCatalogSongsFromJson();
  const profile = await buildProfile(body);
  const preferenceTags = preferenceTagsFromProfile(profile);
  const narrative = profile.narrative?.trim();

  const stage1Rows = allSongs.map((song) => {
    const { score, matched } = stage1MusicalScore(
      song,
      profile,
      narrative || undefined,
    );
    return { song, stage1: score, matched };
  });

  stage1Rows.sort((a, b) => b.stage1 - a.stage1);
  const shortlist = stage1Rows.slice(0, STAGE1_SHORTLIST).map((r) => r.song);

  const albumCounts = new Map<string, number>();
  for (const s of shortlist) {
    if (!s.albumId) continue;
    albumCounts.set(s.albumId, (albumCounts.get(s.albumId) ?? 0) + 1);
  }

  const deltas = await llmAgeSituationDeltas(shortlist, profile);

  const merged: ScoredRow[] = stage1Rows.slice(0, STAGE1_SHORTLIST).map((r) => {
    const { song, stage1, matched } = r;
    const llmDelta = deltas.get(song.id) ?? 0;
    const chart = chartRankBonus(song);
    const album = albumClusterBonus(song, albumCounts);
    const raw = stage1 + llmDelta + chart + album;
    return { song, stage1, llmDelta, chart, album, raw, matched };
  });

  merged.sort((a, b) => b.raw - a.raw);
  const top = merged.slice(0, FINAL_N);
  const maxRaw = Math.max(...top.map((r) => r.raw), 1e-6);

  const items: RecommendationItem[] = top.map((r) => ({
    songId: r.song.id,
    title: r.song.title,
    artist: r.song.artist,
    genre: r.song.genre,
    finalScore: (r.raw / maxRaw) * 10,
    reason: "",
    fitFactors: buildFitFactors(r),
    coverUrl: r.song.coverUrl,
    scoreBreakdown: {
      content: r.stage1,
      collaborative: r.llmDelta,
      context: r.chart + r.album,
    },
  }));

  return { profile, preferenceTags, items };
}

export function validateRecommendRequest(
  body: unknown,
): body is RecommendRequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (b.mode !== "simple" && b.mode !== "detailed") return false;
  if (typeof b.ageRange !== "string" || !b.ageRange.trim()) return false;
  if (typeof b.situation !== "string" || !b.situation.trim()) return false;

  const validSituation = SITUATION_OPTIONS.some((s) => s.value === b.situation);
  if (!validSituation) return false;

  if (b.mode === "simple") {
    return typeof b.narrative === "string" && b.narrative.trim().length >= 2;
  }

  if (
    typeof b.genre !== "string" ||
    !b.genre.trim() ||
    typeof b.mood !== "string" ||
    !b.mood.trim()
  ) {
    return false;
  }

  const rawTempo = b.tempo;
  if (rawTempo === undefined || rawTempo === null) return true;
  if (typeof rawTempo !== "string") return false;
  const tt = rawTempo.trim();
  if (tt === "" || tt === TEMPO_NONE_VALUE) return true;
  return isTasteTempo(tt);
}
