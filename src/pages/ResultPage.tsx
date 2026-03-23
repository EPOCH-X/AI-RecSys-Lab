import songs from "../data/songs.json";
import { RecommendationCard } from "../components/result/RecommendationCard";

interface ResultPageProps {
  navigate: (route: "home" | "questions" | "results") => void;
}

const previewRecommendations = songs.slice(0, 3).map((song, index) => ({
  songId: song.id,
  title: song.title,
  artist: song.artist,
  finalScore: 8 - index,
  reason: "현재 선택된 분위기와 활동 태그에 잘 맞는 곡으로 분류되었습니다.",
  scoreBreakdown: {
    content: 5 - index,
    collaborative: 2,
    context: 1
  }
}));

export function ResultPage({ navigate }: ResultPageProps) {
  return (
    <section className="grid grid--2">
      <article className="panel">
        <h2>Recommendation Preview</h2>
        <div className="recommendation-list">
          {previewRecommendations.map((item) => (
            <RecommendationCard key={item.songId} item={item} />
          ))}
        </div>
        <div className="actions">
          <button className="button" onClick={() => navigate("questions")} type="button">
            다시 질문 보기
          </button>
          <button className="button button--secondary" onClick={() => navigate("home")} type="button">
            홈으로
          </button>
        </div>
      </article>
      <aside className="panel">
        <h3>현재 결과 상태</h3>
        <ul className="list">
          <li>샘플 데이터 기반 미리보기</li>
          <li>실제 LangGraph 연결 전 단계</li>
          <li>다음 작업은 질문 응답 상태와 추천 로직 연결</li>
        </ul>
      </aside>
    </section>
  );
}
