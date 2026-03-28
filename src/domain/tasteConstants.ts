/** songs.json / 질문과 동일한 한글 라벨 */

export const TASTE_GENRES = [
  "발라드",
  "댄스",
  "힙합",
  "R&B",
  "록/밴드",
  "팝",
  "인디",
  "기타/애매",
  "OST",
] as const;

export const TASTE_MOODS = [
  "밝음",
  "감성",
  "신남",
  "잔잔함",
  "몽환",
  "강렬함",
  "기타/애매",
] as const;

export const TASTE_TEMPOS = ["느림", "보통", "빠름"] as const;

/** 상세 모드에서 템포 미지정 시 Select value (카탈로그 라벨 아님) */
export const TEMPO_NONE_VALUE = "__none__";
export const TEMPO_NONE_LABEL = "선택 안 함";

export const AGE_RANGES = ["10대", "20대", "30대", "40대", "50대 이상"] as const;

/** value → 내부 activity 키 (LLM·로그용) */
export const SITUATION_OPTIONS: { label: string; value: string }[] = [
  { label: "공부·집중", value: "study" },
  { label: "운동", value: "workout" },
  { label: "휴식·쉼", value: "relax" },
  { label: "출퇴근·이동", value: "commute" },
  { label: "밤", value: "night" },
  { label: "드라이브", value: "drive" },
];

export type TasteGenre = (typeof TASTE_GENRES)[number];
export type TasteMood = (typeof TASTE_MOODS)[number];
export type TasteTempo = (typeof TASTE_TEMPOS)[number];

export function isTasteGenre(s: string): s is TasteGenre {
  return (TASTE_GENRES as readonly string[]).includes(s);
}

export function isTasteMood(s: string): s is TasteMood {
  return (TASTE_MOODS as readonly string[]).includes(s);
}

export function isTasteTempo(s: string): s is TasteTempo {
  return (TASTE_TEMPOS as readonly string[]).includes(s);
}

export function isExplicitTempoChoice(s: string | undefined): boolean {
  const t = s?.trim();
  return Boolean(t && t !== TEMPO_NONE_VALUE);
}
