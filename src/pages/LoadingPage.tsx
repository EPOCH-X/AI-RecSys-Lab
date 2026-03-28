"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { LoadingAnimation } from "@/components/common/LoadingAnimation";
import type {
  NormalizedUserProfile,
  RecommendationItem,
} from "@/types/graph";
import type { ScoredSong } from "@/types/song";

type RecommendApiResponse = {
  items?: RecommendationItem[];
  profile?: NormalizedUserProfile | null;
  preferenceTags?: string[];
  candidateSongs?: ScoredSong[];
  error?: string;
};

export function LoadingPage() {
  const {
    applyRecommendationItems,
    patchGraphState,
    setCurrentView,
    setErrorMessage,
    clearRecommendationPool,
  } = useAppStore();

  const recommendationRef = useRef<Promise<RecommendApiResponse> | null>(
    null,
  );

  useEffect(() => {
    patchGraphState({ sessionStatus: "recommending" });
    const { recommendRequest } = useAppStore.getState();

    if (!recommendRequest) {
      recommendationRef.current = Promise.resolve({
        error: "추천 요청 정보가 없습니다. 홈에서 다시 시작해 주세요.",
      });
      return;
    }

    recommendationRef.current = (async (): Promise<RecommendApiResponse> => {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recommendRequest),
      });
      const data = (await res.json()) as RecommendApiResponse;
      if (!res.ok) {
        return {
          error:
            typeof data.error === "string"
              ? data.error
              : "추천 요청에 실패했습니다.",
        };
      }
      return data;
    })();
  }, [patchGraphState]);

  const handleComplete = () => {
    const pending = recommendationRef.current;
    if (!pending) {
      setErrorMessage("추천 계산이 시작되지 않았습니다.");
      setCurrentView("home");
      return;
    }

    void (async () => {
      try {
        const data = await pending;
        if (data.error || !data.items?.length) {
          setErrorMessage(
            data.error ?? "추천 결과가 비어 있습니다. 입력을 바꿔 다시 시도해 주세요.",
          );
          clearRecommendationPool();
          setCurrentView("home");
          return;
        }
        applyRecommendationItems(data.items, {
          normalizedProfile: data.profile ?? null,
          preferenceTags: data.preferenceTags ?? [],
          candidateSongs: data.candidateSongs ?? [],
        });
        useAppStore.getState().setRecommendRequest(null);
      } catch (e) {
        console.error(e);
        setErrorMessage(
          e instanceof Error ? e.message : "추천을 생성하는 중 오류가 났습니다.",
        );
        clearRecommendationPool();
        setCurrentView("home");
      }
    })();
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingAnimation onComplete={handleComplete} />
    </div>
  );
}

export default LoadingPage;
