import type { NormalizedUserProfile, RecommendationItem } from "../types/graph";

/** `toRecommendationItems` 기본 문구와 동일해야 LLM 실패 시 치환 판별이 맞음 */
const PLACEHOLDER_REASON =
  "선호 태그와 현재 상황을 기준으로 우선 추천된 곡입니다.";

function getGeminiModelCandidates(): string[] {
  const fromEnv = process.env.NEXT_PUBLIC_GEMINI_MODEL?.trim();
  const fallbacks = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
  ];
  const ordered = fromEnv
    ? [fromEnv, ...fallbacks.filter((m) => m !== fromEnv)]
    : fallbacks;
  return [...new Set(ordered)];
}

export interface ReasoningInput {
  userProfile: NormalizedUserProfile;
  recommendations: RecommendationItem[];
}

function getApiKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  return typeof key === "string" && key.trim() ? key.trim() : undefined;
}

type TempoKeyword = "slow" | "mid" | "fast";
type EnergyKeyword = "low" | "medium" | "high";

interface FreeTextAugmentation {
  moods?: string[];
  genres?: string[];
  activities?: string[];
  tempo?: TempoKeyword;
  energy?: EnergyKeyword;
}

const ALLOWED_MOODS = [
  "calm",
  "energetic",
  "emotional",
  "comforting",
  "romantic",
] as const;
const ALLOWED_GENRES = [
  "pop",
  "r&b",
  "soul",
  "acoustic",
  "lo-fi",
  "ballad",
  "indie",
] as const;
const ALLOWED_ACTIVITIES = ["study", "workout", "relax", "commute"] as const;
const ALLOWED_TEMPO = ["slow", "mid", "fast"] as const;
const ALLOWED_ENERGY = ["low", "medium", "high"] as const;

export async function callGeminiJson(prompt: string): Promise<unknown | null> {
  const key = getApiKey();
  if (!key) return null;

  const models = getGeminiModelCandidates();
  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.35,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  });

  try {
    for (let i = 0; i < models.length; i++) {
      const model = models[i]!;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (res.status === 429) {
        if (i < models.length - 1) continue;
        return null;
      }

      if (!res.ok) {
        const retryable =
          i < models.length - 1 && (res.status === 404 || res.status === 400);
        if (retryable) continue;
        return null;
      }

      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof text !== "string" || !text.trim()) return null;

      try {
        return JSON.parse(text) as unknown;
      } catch {
        return null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

const HEURISTIC_LEXICON = {
  moods: [
    {
      keys: ["잔잔", "조용", "calm", "chill", "tired", "burnout"],
      tag: "calm",
    },
    { keys: ["신남", "들뜸", "upbeat", "excited", "energy"], tag: "energetic" },
    { keys: ["감성", "슬픔", "sad", "melanch", "emotional"], tag: "emotional" },
    { keys: ["위로", "포근", "comfort", "heal", "warm"], tag: "comforting" },
    { keys: ["사랑", "연애", "데이트", "love", "romantic"], tag: "romantic" },
  ],
  genres: [
    { keys: ["pop", "팝"], tag: "pop" },
    { keys: ["r&b", "rnb", "알앤비"], tag: "r&b" },
    { keys: ["soul", "소울"], tag: "soul" },
    { keys: ["acoustic", "어쿠스틱"], tag: "acoustic" },
    { keys: ["lofi", "lo-fi", "로파이"], tag: "lo-fi" },
    { keys: ["ballad", "발라드"], tag: "ballad" },
    { keys: ["indie", "인디"], tag: "indie" },
  ],
  activities: [
    { keys: ["공부", "집중", "study", "focus"], tag: "study" },
    { keys: ["운동", "헬스", "run", "gym", "workout"], tag: "workout" },
    { keys: ["쉬", "휴식", "relax", "rest", "chill"], tag: "relax" },
    { keys: ["출근", "퇴근", "이동", "commute", "drive"], tag: "commute" },
  ],
  tempo: [
    { keys: ["느리", "잔잔", "slow", "ballad"], tag: "slow" },
    { keys: ["보통", "mid", "medium"], tag: "mid" },
    { keys: ["빠르", "신나", "fast", "upbeat"], tag: "fast" },
  ],
  energy: [
    { keys: ["낮", "차분", "low energy", "soft"], tag: "low" },
    { keys: ["중간", "적당", "medium energy"], tag: "medium" },
    { keys: ["강", "쎄", "high energy", "powerful"], tag: "high" },
  ],
} as const;

function pickAllowed(values: unknown, allowed: readonly string[]): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.toLowerCase())
    .filter(
      (value, index, arr) =>
        allowed.includes(value) && arr.indexOf(value) === index,
    );
}

function pickSingleAllowed(
  value: unknown,
  allowed: readonly string[],
): string | undefined {
  return typeof value === "string" && allowed.includes(value.toLowerCase())
    ? value.toLowerCase()
    : undefined;
}

function tempoToRange(tempo?: string): [number, number] | undefined {
  if (tempo === "slow") return [60, 85];
  if (tempo === "mid") return [86, 110];
  if (tempo === "fast") return [111, 160];
  return undefined;
}

function energyToLevel(energy?: string): number | undefined {
  if (energy === "low") return 2;
  if (energy === "medium") return 3;
  if (energy === "high") return 5;
  return undefined;
}

function extractFreeTextHeuristic(freeText: string): FreeTextAugmentation {
  const lower = freeText.toLowerCase();
  const moods = new Set<string>();
  const genres = new Set<string>();
  const activities = new Set<string>();
  let tempo: TempoKeyword | undefined;
  let energy: EnergyKeyword | undefined;

  for (const { keys, tag } of HEURISTIC_LEXICON.moods) {
    if (
      keys.some(
        (key) => lower.includes(key.toLowerCase()) || freeText.includes(key),
      )
    )
      moods.add(tag);
  }

  for (const { keys, tag } of HEURISTIC_LEXICON.genres) {
    if (
      keys.some(
        (key) => lower.includes(key.toLowerCase()) || freeText.includes(key),
      )
    )
      genres.add(tag);
  }

  for (const { keys, tag } of HEURISTIC_LEXICON.activities) {
    if (
      keys.some(
        (key) => lower.includes(key.toLowerCase()) || freeText.includes(key),
      )
    )
      activities.add(tag);
  }

  for (const { keys, tag } of HEURISTIC_LEXICON.tempo) {
    if (
      !tempo &&
      keys.some(
        (key) => lower.includes(key.toLowerCase()) || freeText.includes(key),
      )
    ) {
      tempo = tag;
    }
  }

  for (const { keys, tag } of HEURISTIC_LEXICON.energy) {
    if (
      !energy &&
      keys.some(
        (key) => lower.includes(key.toLowerCase()) || freeText.includes(key),
      )
    ) {
      energy = tag;
    }
  }

  return {
    moods: [...moods],
    genres: [...genres],
    activities: [...activities],
    tempo,
    energy,
  };
}

export async function enrichProfileWithFreeText(
  profile: NormalizedUserProfile,
  freeTextRaw?: string,
): Promise<NormalizedUserProfile> {
  const raw = freeTextRaw?.trim();
  if (!raw) return profile;

  const prompt = `You interpret a user's Korean or English free-text music request.
Return ONLY valid JSON with this exact shape:
{
  "moods": string[],
  "genres": string[],
  "activities": string[],
  "tempo": string | null,
  "energy": string | null
}

Allowed moods: ["calm","energetic","emotional","comforting","romantic"]
Allowed genres: ["pop","r&b","soul","acoustic","lo-fi","ballad","indie"]
Allowed activities: ["study","workout","relax","commute"]
Allowed tempo: ["slow","mid","fast"]
Allowed energy: ["low","medium","high"]

Rules:
- Choose only values from the allowed lists.
- Use empty arrays when there is no signal.
- Use null for tempo or energy when unclear.
- Do not explain anything outside JSON.

User text: ${JSON.stringify(raw)}`;

  const parsed = await callGeminiJson(prompt);
  let augmentation: FreeTextAugmentation = {};
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const candidate = parsed as Record<string, unknown>;
    augmentation = {
      moods: pickAllowed(candidate.moods, ALLOWED_MOODS),
      genres: pickAllowed(candidate.genres, ALLOWED_GENRES),
      activities: pickAllowed(candidate.activities, ALLOWED_ACTIVITIES),
      tempo: pickSingleAllowed(candidate.tempo, ALLOWED_TEMPO) as
        | TempoKeyword
        | undefined,
      energy: pickSingleAllowed(candidate.energy, ALLOWED_ENERGY) as
        | EnergyKeyword
        | undefined,
    };
  }

  const hasStructuredSignal =
    (augmentation.moods?.length ?? 0) > 0 ||
    (augmentation.genres?.length ?? 0) > 0 ||
    (augmentation.activities?.length ?? 0) > 0 ||
    augmentation.tempo !== undefined ||
    augmentation.energy !== undefined;

  if (!hasStructuredSignal) {
    augmentation = extractFreeTextHeuristic(raw);
  }

  const mergedMoods = [
    ...new Set([...profile.moods, ...(augmentation.moods ?? [])]),
  ];
  const mergedGenres = [
    ...new Set([...profile.genres, ...(augmentation.genres ?? [])]),
  ];
  const mergedActivities = [
    ...new Set([...profile.activities, ...(augmentation.activities ?? [])]),
  ];

  return {
    ...profile,
    moods: mergedMoods,
    genres: mergedGenres,
    activities: mergedActivities,
    tempos: profile.tempos,
    favoriteArtists: profile.favoriteArtists,
    ageRange: profile.ageRange,
    preferredBpmRange:
      profile.preferredBpmRange ?? tempoToRange(augmentation.tempo),
    energyLevel: profile.energyLevel ?? energyToLevel(augmentation.energy),
  };
}

function fallbackReason(
  item: RecommendationItem,
  profile: NormalizedUserProfile,
): string {
  const mood = profile.moods[0] ?? "선호";
  const act = profile.activities[0] ?? "현재 상황";
  return `${mood} 무드와 ${act} 맥락에 맞춰, ${item.title} — ${item.artist} 곡이 점수 상위로 선택되었습니다.`;
}

function ensureReasons(
  items: RecommendationItem[],
  profile: NormalizedUserProfile,
): RecommendationItem[] {
  return items.map((item) => {
    const reason = item.reason?.trim() ?? "";
    const isPlaceholder = reason.length === 0 || reason === PLACEHOLDER_REASON;
    return isPlaceholder
      ? { ...item, reason: fallbackReason(item, profile) }
      : item;
  });
}

export async function generateReasons(
  input: ReasoningInput,
): Promise<RecommendationItem[]> {
  const { userProfile, recommendations } = input;

  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    return [];
  }

  if (!getApiKey()) {
    return ensureReasons(recommendations, userProfile);
  }

  const payload = recommendations.map((r) => ({
    songId: r.songId,
    title: r.title,
    artist: r.artist,
    finalScore: r.finalScore,
    scoreBreakdown: r.scoreBreakdown,
  }));

  const prompt = `You are a concise music recommender explaining why each song fits the user.

User profile (JSON): ${JSON.stringify(userProfile)}

Recommended songs (JSON): ${JSON.stringify(payload)}

Return ONLY valid JSON: an array of objects with exactly these keys: "songId" (string), "reason" (string, Korean, 1-2 sentences).
Include one object per song in the same order as the input array. Do not change songId values.`;

  const parsed = await callGeminiJson(prompt);
  if (!Array.isArray(parsed)) {
    return ensureReasons(recommendations, userProfile);
  }

  const byId = new Map<string, string>();
  for (const row of parsed) {
    if (row && typeof row === "object" && "songId" in row && "reason" in row) {
      const o = row as { songId: unknown; reason: unknown };
      if (
        typeof o.songId === "string" &&
        typeof o.reason === "string" &&
        o.reason.trim()
      ) {
        byId.set(o.songId, o.reason.trim());
      }
    }
  }

  const merged = recommendations.map((item) => {
    const reason = byId.get(item.songId);
    return reason ? { ...item, reason } : item;
  });

  return ensureReasons(merged, userProfile);
}
