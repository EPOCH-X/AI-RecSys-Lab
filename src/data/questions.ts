import type { Question } from "../types/question";

export const questions: Question[] = [
  {
    id: "mood",
    title: "지금 어떤 분위기의 음악을 듣고 싶나요?",
    description: "현재 감정이나 원하는 무드를 선택하세요.",
    type: "single",
    required: true,
    skippable: false,
    mapsTo: "mood",
    options: [
      { id: "mood-calm", label: "차분한", value: "calm", tags: ["calm"] },
      { id: "mood-energetic", label: "신나는", value: "energetic", tags: ["energetic"] },
      { id: "mood-emotional", label: "감성적인", value: "emotional", tags: ["emotional"] },
      { id: "mood-comfort", label: "위로되는", value: "comforting", tags: ["comforting"] }
    ]
  },
  {
    id: "activity",
    title: "지금 어떤 상황에서 듣고 있나요?",
    description: "활동 맥락은 추천 재정렬에 사용됩니다.",
    type: "single",
    required: true,
    skippable: true,
    mapsTo: "activity",
    options: [
      { id: "activity-study", label: "공부", value: "study", tags: ["study"] },
      { id: "activity-workout", label: "운동", value: "workout", tags: ["workout"] },
      { id: "activity-relax", label: "휴식", value: "relax", tags: ["relax"] },
      { id: "activity-commute", label: "이동 중", value: "commute", tags: ["commute"] }
    ]
  },
  {
    id: "genre",
    title: "선호하는 장르는 무엇인가요?",
    description: "가장 듣고 싶은 장르를 골라주세요.",
    type: "single",
    required: true,
    skippable: true,
    mapsTo: "genre",
    options: [
      { id: "genre-lofi", label: "Lo-fi", value: "Lo-fi", tags: ["lofi"] },
      { id: "genre-pop", label: "Pop", value: "Pop", tags: ["pop"] },
      { id: "genre-rnb", label: "R&B", value: "R&B", tags: ["rnb"] },
      { id: "genre-ballad", label: "Ballad", value: "Ballad", tags: ["ballad"] }
    ]
  },
  {
    id: "tempo",
    title: "템포는 어느 쪽이 좋나요?",
    description: "BPM 범위 추정에 사용됩니다.",
    type: "single",
    required: false,
    skippable: true,
    mapsTo: "tempo",
    options: [
      { id: "tempo-slow", label: "느린 편", value: "slow", tags: ["slow_bpm"] },
      { id: "tempo-mid", label: "보통", value: "mid", tags: ["mid_bpm"] },
      { id: "tempo-fast", label: "빠른 편", value: "fast", tags: ["fast_bpm"] }
    ]
  },
  {
    id: "time",
    title: "지금 시간대는 언제인가요?",
    type: "single",
    required: false,
    skippable: true,
    mapsTo: "time",
    options: [
      { id: "time-morning", label: "아침", value: "morning", tags: ["morning"] },
      { id: "time-afternoon", label: "낮", value: "afternoon", tags: ["afternoon"] },
      { id: "time-evening", label: "저녁", value: "evening", tags: ["evening"] },
      { id: "time-night", label: "밤", value: "night", tags: ["night"] }
    ]
  },
  {
    id: "lyrics",
    title: "가사가 있는 곡이 좋나요?",
    description: "집중 상황에서는 무가사 선호가 반영됩니다.",
    type: "boolean",
    required: false,
    skippable: true,
    mapsTo: "lyrics",
    options: [
      { id: "lyrics-yes", label: "있어도 좋아요", value: "true", tags: ["lyrics"] },
      { id: "lyrics-no", label: "없는 게 좋아요", value: "false", tags: ["instrumental"] }
    ]
  },
  {
    id: "freeTextMood",
    title: "지금 기분을 자유롭게 적어주세요.",
    description: "자유 텍스트는 추후 태그 정규화와 LLM 보강에 사용됩니다.",
    type: "text",
    required: false,
    skippable: true,
    mapsTo: "mood"
  }
];
