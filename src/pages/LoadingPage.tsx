"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { LoadingAnimation } from "@/components/common/LoadingAnimation";
import { runRecommendationGraph } from "@/graph/recommendationGraph";

export function LoadingPage() {
  const {
    applyRecommendationItems,
    patchGraphState,
    setCurrentView,
    setRecommendations,
    setErrorMessage,
  } = useAppStore();

  const recommendationRef = useRef<ReturnType<typeof runRecommendationGraph> | null>(
    null,
  );

  useEffect(() => {
    patchGraphState({ sessionStatus: "recommending" });
    const { graphState } = useAppStore.getState();
    recommendationRef.current = runRecommendationGraph(graphState);
  }, [patchGraphState]);

  const handleComplete = () => {
    const pending = recommendationRef.current;
    if (!pending) {
      setErrorMessage("추천 계산이 시작되지 않았습니다.");
      setCurrentView("questions");
      return;
    }

    void (async () => {
      try {
        const next = await pending;
        if (next.sessionStatus === "error") {
          setErrorMessage(next.errorMessage ?? "추천에 실패했습니다.");
          setRecommendations([]);
          setCurrentView("questions");
          return;
        }
        applyRecommendationItems(next.finalRecommendations, {
          normalizedProfile: next.normalizedProfile,
          preferenceTags: next.preferenceTags,
          candidateSongs: next.candidateSongs,
        });
      } catch (e) {
        console.error(e);
        setErrorMessage(
          e instanceof Error ? e.message : "추천을 생성하는 중 오류가 났습니다.",
        );
        setRecommendations([]);
        setCurrentView("questions");
      }
    })();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingAnimation onComplete={handleComplete} />
    </div>
  );
}

export default LoadingPage;
