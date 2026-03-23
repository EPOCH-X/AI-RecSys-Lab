import type { Question } from "../../types/question";

interface QuestionCardProps {
  question: Question;
}

export function QuestionCard({ question }: QuestionCardProps) {
  return (
    <div>
      <div className="question-card__title">{question.title}</div>
      {question.description ? (
        <div className="question-card__description">{question.description}</div>
      ) : null}
    </div>
  );
}
