import type { RecommendationItem } from "../../types/graph";

interface ScoreBreakdownProps {
  item: RecommendationItem;
}

export function ScoreBreakdown({ item }: ScoreBreakdownProps) {
  const { content, collaborative, context } = item.scoreBreakdown;
  return (
    <div className="score-breakdown">
      Content {content} / Collaborative {collaborative} / Context {context}
    </div>
  );
}
