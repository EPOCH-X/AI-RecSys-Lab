import { QuestionCard } from "../components/question/QuestionCard";
import { AnswerOptionList } from "../components/question/AnswerOptionList";
import { ProgressBar } from "../components/common/ProgressBar";
import { questions } from "../data/questions";

interface QuestionPageProps {
  navigate: (route: "home" | "questions" | "results") => void;
}

export function QuestionPage({ navigate }: QuestionPageProps) {
  const currentQuestion = questions[0];

  return (
    <section className="grid grid--2">
      <article className="panel">
        <h2>Question Flow Preview</h2>
        <ProgressBar value={1} max={questions.length} />
        <QuestionCard question={currentQuestion} />
        {currentQuestion.options ? <AnswerOptionList options={currentQuestion.options} /> : null}
        <div className="actions">
          <button className="button" onClick={() => navigate("results")} type="button">
            추천 보기
          </button>
          <button className="button button--secondary" onClick={() => navigate("home")} type="button">
            홈으로
          </button>
        </div>
      </article>
      <aside className="panel">
        <h3>질문 세트</h3>
        <ul className="list">
          {questions.map((question) => (
            <li key={question.id}>
              {question.title} ({question.type})
            </li>
          ))}
        </ul>
      </aside>
    </section>
  );
}
