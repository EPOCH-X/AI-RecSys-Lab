/**
 * 동일 곡이 iTunes에서 다른 trackId(앨범 아트·버전만 다른 릴리스)로
 * 여러 번 들어올 때 하나로 취급하기 위한 키.
 */
function normalizeWhitespace(s: string): string {
  return s.normalize("NFKC").trim().replace(/\s+/g, " ");
}

/** 괄호/대괄호 뒤 버전 표기 제거 — "(Strings Version)", "[Remastered]" 등 */
function stripTrailingVersionHints(title: string): string {
  let t = title.trim();
  t = t.replace(/\s*\([^)]*\)\s*$/u, "").trim();
  t = t.replace(/\s*\[[^\]]*\]\s*$/u, "").trim();
  return t;
}

export function trackFingerprint(artist: string, title: string): string {
  const a = normalizeWhitespace(artist).toLowerCase();
  let t = normalizeWhitespace(title).toLowerCase();
  const stripped = stripTrailingVersionHints(t);
  if (stripped.length > 0) t = stripped;
  return `${a}\0${t}`;
}
