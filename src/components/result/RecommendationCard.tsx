import type { RecommendationItem } from "../../types/graph";
import { ScoreBreakdown } from "./ScoreBreakdown";

interface RecommendationCardProps {
  item: RecommendationItem;
}

export function RecommendationCard({ item }: RecommendationCardProps) {
  return (
    <article className="recommendation-card">
      <div className="recommendation-card__meta">
        <div>
          <div className="recommendation-card__title">{item.title}</div>
          <div className="recommendation-card__artist">{item.artist}</div>
        </div>
        <strong>{item.finalScore.toFixed(1)}</strong>
      </div>
      <p>{item.reason}</p>
      <ScoreBreakdown item={item} />
    </article>
  );
}
