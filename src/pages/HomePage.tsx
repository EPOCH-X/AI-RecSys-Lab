"use client";

import { ArrowRight, Sparkles, Music2, Brain, ListChecks, PenLine } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";

export function HomePage() {
  const { setCurrentView, resetAnswers } = useAppStore();

  const goSimple = () => {
    resetAnswers();
    setCurrentView("simple");
  };

  const goDetailed = () => {
    resetAnswers();
    setCurrentView("detailed");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15]">
            <span className="block text-balance">지금 상황에 맞는</span>
            <span className="mt-2 block text-balance sm:mt-2.5">
              <span className="text-primary">노래</span>를 추천받아 보세요
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto text-pretty">
            문장으로 간단히 적거나, 장르·분위기·템포를 한 화면에서 고를 수
            있습니다. 연령과 듣는 상황을 반영해 후보를 좁힌 뒤 상위 5곡을
            추천합니다.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              variant="default"
              onClick={goSimple}
              className="px-8 py-6 text-lg rounded-xl shadow-lg shadow-primary/20"
            >
              <PenLine className="w-5 h-5 mr-2" />
              간단하게 (문장)
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={goDetailed}
              className="px-8 py-6 text-lg rounded-xl"
            >
              <ListChecks className="w-5 h-5 mr-2" />
              상세하게 (객관식)
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              <span>규칙 + LLM</span>
            </div>
            <div className="flex items-center gap-2">
              <Music2 className="w-4 h-4 text-primary" />
              <span>차트·앨범 반영</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>추천 이유 생성</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default HomePage;
