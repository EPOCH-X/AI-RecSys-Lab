export type QuestionType = "single" | "multi" | "boolean" | "text";

export type QuestionMapTarget =
  | "mood"
  | "activity"
  | "genre"
  | "tempo"
  | "energy";

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
  tags?: string[];
}

export interface Question {
  id: string;
  title: string;
  description?: string;
  type: QuestionType;
  options?: QuestionOption[];
  required: boolean;
  skippable: boolean;
  mapsTo: QuestionMapTarget;
}

export interface AnswerRecord {
  questionId: string;
  value: string | string[] | boolean;
  skipped?: boolean;
}
