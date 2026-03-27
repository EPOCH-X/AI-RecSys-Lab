import { questions as sourceQuestions } from "@/data/questions";
import type { Question as SourceQuestion } from "@/types/question";

export interface QuestionViewModel {
  id: string;
  text: string;
  category: string;
  placeholder: string;
  type: SourceQuestion["type"];
  skippable: boolean;
  options: SourceQuestion["options"];
}

function buildCategory(question: SourceQuestion): string {
  return question.mapsTo.charAt(0).toUpperCase() + question.mapsTo.slice(1);
}

function buildPlaceholder(question: SourceQuestion): string {
  if (question.type === "text") {
    return "예: 오늘은 퇴근길이라 너무 자극적이지 않은 lo-fi나 acoustic 계열로, 차분하지만 조금 로맨틱한 곡이 듣고 싶어요.";
  }

  return "아래 선택지 중 하나를 골라주세요.";
}

export const questions: QuestionViewModel[] = sourceQuestions.map(
  (question) => ({
    id: question.id,
    text: question.title,
    category: buildCategory(question),
    placeholder: buildPlaceholder(question),
    type: question.type,
    skippable: question.skippable,
    options: question.options,
  }),
);
