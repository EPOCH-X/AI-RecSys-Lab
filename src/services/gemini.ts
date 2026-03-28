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

function getApiKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  return typeof key === "string" && key.trim() ? key.trim() : undefined;
}

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
