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

/** 100곡 adjustments 등 긴 JSON — 1024 토큰이면 잘려 parse 실패가 난다 */
const DEFAULT_MAX_OUTPUT_TOKENS = 8192;

/**
 * 모델이 코드펜스·설명을 붙이거나 잘린 JSON을 줄 때 대비.
 * 최상위 `{ ... }` 한 덩어리를 문자열/이스케이프를 고려해 추출한다.
 */
function extractTopLevelJsonObject(text: string): string | null {
  let body = text.trim();
  const fence = body.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) body = fence[1].trim();

  const start = body.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < body.length; i++) {
    const c = body[i]!;
    if (esc) {
      esc = false;
      continue;
    }
    if (c === "\\" && inStr) {
      esc = true;
      continue;
    }
    if (c === '"') {
      inStr = !inStr;
      continue;
    }
    if (!inStr) {
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) return body.slice(start, i + 1);
      }
    }
  }
  return null;
}

function parseModelJsonText(text: string): unknown | null {
  const trimmed = text.trim();
  const attempts: string[] = [trimmed];
  const extracted = extractTopLevelJsonObject(text);
  if (extracted && extracted !== trimmed) attempts.push(extracted);

  for (const chunk of attempts) {
    try {
      return JSON.parse(chunk) as unknown;
    } catch {
      continue;
    }
  }
  return null;
}

/** 서버 전용 키 우선(클라이언트 번들에 안 실림). 없으면 기존 공개 키 이름도 허용. */
function getApiKey(): string | undefined {
  const server = process.env.GEMINI_API_KEY?.trim();
  if (server) return server;
  const pub = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  return typeof pub === "string" && pub.trim() ? pub.trim() : undefined;
}

export async function callGeminiJson(prompt: string): Promise<unknown | null> {
  const key = getApiKey();
  if (!key) {
    return null;
  }

  const models = getGeminiModelCandidates();
  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.35,
      maxOutputTokens: (() => {
        const raw = process.env.GEMINI_MAX_OUTPUT_TOKENS?.trim();
        const n = raw ? Number.parseInt(raw, 10) : NaN;
        return Number.isFinite(n) && n > 0 ? n : DEFAULT_MAX_OUTPUT_TOKENS;
      })(),
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
      if (typeof text !== "string" || !text.trim()) {
        return null;
      }

      const parsed = parseModelJsonText(text);
      if (parsed !== null) {
        return parsed;
      }
      continue;
    }
    return null;
  } catch {
    return null;
  }
}
