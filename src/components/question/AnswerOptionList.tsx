import type { QuestionOption } from "../../types/question";

interface AnswerOptionListProps {
  options: QuestionOption[];
}

export function AnswerOptionList({ options }: AnswerOptionListProps) {
  return (
    <div className="option-list">
      {options.map((option) => (
        <button key={option.id} className="chip" type="button">
          {option.label}
        </button>
      ))}
    </div>
  );
}
