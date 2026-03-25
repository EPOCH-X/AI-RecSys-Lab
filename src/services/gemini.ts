import type { NormalizedUserProfile, RecommendationItem } from "../types/graph";

/** `toRecommendationItems` 기본 문구와 동일해야 LLM 실패 시 치환 판별이 맞음 */
const PLACEHOLDER_REASON =
  "선호 태그와 현재 상황을 기준으로 우선 추천된 곡입니다.";

function getGeminiModelCandidates(): string[] {
  const fromEnv = process.env.NEXT_PUBLIC_GEMINI_MODEL?.trim();
  const fallbacks = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash"];
  const ordered = fromEnv ? [fromEnv, ...fallbacks.filter((m) => m !== fromEnv)] : fallbacks;
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

async function callGeminiJson(prompt: string): Promise<unknown | null> {
  const key = getApiKey();
  if (!key) return null;

  const models = getGeminiModelCandidates();
  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.35,
      maxOutputTokens: 1024,
      responseMimeType: "application/json"
    }
  });

  try {
    for (let i = 0; i < models.length; i++) {
      const model = models[i]!;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
      });

      if (res.status === 429) {
        if (i < models.length - 1) continue;
        return null;
      }

      if (!res.ok) {
        const retryable = i < models.length - 1 && (res.status === 404 || res.status === 400);
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

const MOOD_LEXICON: Array<{ keys: string[]; tag: string }> = [
  { keys: ["피곤", "지침", "힘들", "burnout", "tired"], tag: "calm" },
  { keys: ["우울", "슬프", "sad", "melancholic"], tag: "comforting" },
  { keys: ["신남", "들뜸", "happy", "excited"], tag: "energetic" },
  { keys: ["집중", "공부", "study", "focus"], tag: "study" },
  { keys: ["밤", "night", "late"], tag: "night" },
  { keys: ["잔잔", "조용", "calm", "chill"], tag: "calm" }
];

export function extractMoodTagsHeuristic(freeText: string): string[] {
  const lower = freeText.toLowerCase();
  const out = new Set<string>();
  for (const { keys, tag } of MOOD_LEXICON) {
    if (keys.some((k) => lower.includes(k.toLowerCase()) || freeText.includes(k))) out.add(tag);
  }
  return [...out];
}

export async function enrichProfileWithFreeText(
  profile: NormalizedUserProfile,
  freeTextRaw?: string
): Promise<NormalizedUserProfile> {
  const raw = freeTextRaw?.trim();
  if (!raw) return profile;

  const prompt = `You map a user's short Korean or English mood description to mood tags for music recommendation.
Return ONLY a JSON array of lowercase English tags chosen from this closed set:
["calm","energetic","emotional","comforting","night","study","bright","steady"]
Use at most 5 tags. If unclear, return [].

User text: ${JSON.stringify(raw)}`;

  const parsed = await callGeminiJson(prompt);
  let tags: string[] = [];
  if (Array.isArray(parsed)) {
    tags = parsed.filter((x): x is string => typeof x === "string").map((t) => t.toLowerCase());
  }
  if (tags.length === 0) {
    tags = extractMoodTagsHeuristic(raw);
  }

  const mergedMoods = [...new Set([...profile.moods, ...tags])];
  return { ...profile, moods: mergedMoods };
}

function fallbackReason(item: RecommendationItem, profile: NormalizedUserProfile): string {
  const mood = profile.moods[0] ?? "선호";
  const act = profile.activities[0] ?? "현재 상황";
  return `${mood} 무드와 ${act} 맥락에 맞춰, ${item.title} — ${item.artist} 곡이 점수 상위로 선택되었습니다.`;
}

function ensureReasons(items: RecommendationItem[], profile: NormalizedUserProfile): RecommendationItem[] {
  return items.map((item) => {
    const reason = item.reason?.trim() ?? "";
    const isPlaceholder = reason.length === 0 || reason === PLACEHOLDER_REASON;
    return isPlaceholder ? { ...item, reason: fallbackReason(item, profile) } : item;
  });
}

export async function generateReasons(input: ReasoningInput): Promise<RecommendationItem[]> {
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
    scoreBreakdown: r.scoreBreakdown
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
      if (typeof o.songId === "string" && typeof o.reason === "string" && o.reason.trim()) {
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
