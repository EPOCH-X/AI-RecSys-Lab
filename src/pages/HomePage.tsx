interface HomePageProps {
  navigate: (route: "home" | "questions" | "results") => void;
}

export function HomePage({ navigate }: HomePageProps) {
  return (
    <section className="hero grid grid--2">
      <article className="hero__card">
        <span className="eyebrow">AI Music Prototype</span>
        <h1>Akinator-style music recommendation</h1>
        <p>
          질문 기반 인터페이스로 현재 분위기와 상황을 수집하고, 하이브리드 추천 점수와
          LLM 설명을 결합하는 프론트엔드 프로토타입입니다.
        </p>
        <div className="actions">
          <button className="button" onClick={() => navigate("questions")} type="button">
            질문 시작
          </button>
          <button className="button button--secondary" onClick={() => navigate("results")} type="button">
            결과 미리보기
          </button>
        </div>
      </article>
      <aside className="panel">
        <h2>MVP 범위</h2>
        <ul className="list">
          <li>질문 5~7개로 취향과 상황 수집</li>
          <li>콘텐츠 기반 + 협업 필터링 + 상황 재정렬</li>
          <li>Gemini 기반 추천 이유 생성</li>
          <li>로컬 JSON과 localStorage 중심의 실험 구조</li>
        </ul>
      </aside>
    </section>
  );
}
