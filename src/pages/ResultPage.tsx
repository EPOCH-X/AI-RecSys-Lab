"use client";

import { Home, CheckCircle, RefreshCw } from "lucide-react";
import {
  useAppStore,
  getVisibleRecommendations,
  rankRangeLabel,
} from "@/store/useAppStore";
import { RecommendationCard } from "@/components/result/RecommendationCard";
import { Button } from "@/components/ui/button";
import { formatRecommendationProfileSummary } from "@/domain/normalization";

export function ResultPage() {
  const {
    recommendationPool,
    recommendationWindowIndex,
    cycleRecommendationWindow,
    graphState,
    setCurrentView,
    resetAnswers,
  } = useAppStore();

  const handleStartOver = () => {
    resetAnswers();
    setCurrentView("home");
  };

  const visible = getVisibleRecommendations(
    recommendationPool,
    recommendationWindowIndex,
  );
  const rangeLabel = rankRangeLabel(
    recommendationWindowIndex,
    recommendationPool.length,
  );
  const rankOffset = recommendationWindowIndex * 5;

  const answerSummary = formatRecommendationProfileSummary(
    graphState.normalizedProfile,
    graphState.preferenceTags,
  );

  const nextRangeLabel = rankRangeLabel(
    (recommendationWindowIndex + 1) % 3,
    recommendationPool.length,
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">추천 결과</h1>
              <p className="text-sm text-muted-foreground">
                {recommendationPool.length > 0
                  ? `입력하신 취향을 반영한 상위 ${recommendationPool.length}곡 중 ${rangeLabel}`
                  : "추천 목록이 없습니다"}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleStartOver}>
              <Home className="w-5 h-5" />
              <span className="sr-only">홈으로</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Results content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Answer summary card */}
          <div className="mb-8 p-4 rounded-xl bg-card border border-border">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-medium mb-1">취향 요약</h2>
                <p className="text-sm text-muted-foreground">{answerSummary}</p>
              </div>
            </div>
          </div>

          {/* Recommendation cards */}
          <div className="space-y-6">
            {visible.map((song, index) => (
              <RecommendationCard
                key={song.id}
                song={song}
                rank={rankOffset + index + 1}
              />
            ))}
          </div>

          {recommendationPool.length > 5 && (
            <div className="mt-10 flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="gap-2 rounded-xl"
                onClick={() => cycleRecommendationWindow()}
              >
                <RefreshCw className="size-4" />
                다른 노래 추천 받기 ({nextRangeLabel})
              </Button>
            </div>
          )}

          {/* Empty state */}
          {recommendationPool.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">
                아직 추천이 없습니다. 홈에서 다시 시도해 주세요.
              </p>
              <Button onClick={handleStartOver}>홈으로</Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ResultPage;
