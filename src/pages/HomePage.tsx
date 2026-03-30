"use client";

import Image from "next/image";
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
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden">
      <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-2 sm:px-6 sm:py-3">
        <div className="mx-auto flex max-w-2xl -translate-y-2 flex-col items-center text-center sm:-translate-y-4 md:-translate-y-5">
          <div className="flex shrink-0 justify-center">
            <Image
              src="/epoch-x-logo.png"
              alt="EPOCH-X 팀 로고"
              width={1024}
              height={1024}
              priority
              className="h-auto w-full max-w-[200px] drop-shadow-sm sm:max-w-[240px] md:max-w-[280px]"
            />
          </div>

          <h1 className="mt-2 shrink-0 text-balance text-2xl font-bold leading-tight tracking-tight sm:mt-2.5 sm:text-3xl md:text-4xl">
            <span className="block">지금 상황에 맞는</span>
            <span className="mt-0.5 block sm:mt-1">
              <span className="text-primary">노래</span>를 추천받아 보세요
            </span>
          </h1>

          <p className="mt-2 max-w-xl shrink-0 text-pretty text-sm leading-snug text-muted-foreground sm:mt-2.5 sm:text-base">
            문장으로 간단히 적거나, 장르·분위기·템포를 한 화면에서 고를 수
            있습니다. 연령과 듣는 상황을 반영해 후보를 좁힌 뒤 상위 15곡 중에서
            5곡씩 둘러볼 수 있습니다.
          </p>

          <div className="mt-3 flex w-full max-w-lg shrink-0 flex-col justify-center gap-2 sm:mt-4 sm:flex-row sm:gap-3">
            <Button
              size="lg"
              variant="default"
              onClick={goSimple}
              className="rounded-xl px-6 py-4 text-base shadow-lg shadow-primary/20"
            >
              <PenLine className="mr-2 size-4 shrink-0 sm:size-5" />
              간단하게 (문장)
              <ArrowRight className="ml-2 size-4 shrink-0 sm:size-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={goDetailed}
              className="rounded-xl px-6 py-4 text-base"
            >
              <ListChecks className="mr-2 size-4 shrink-0 sm:size-5" />
              상세하게 (객관식)
              <ArrowRight className="ml-2 size-4 shrink-0 sm:size-5" />
            </Button>
          </div>

          <div className="mt-2.5 flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground sm:mt-3 sm:gap-x-6 sm:text-sm">
            <div className="flex items-center gap-1.5">
              <Brain className="size-3.5 shrink-0 text-primary sm:size-4" />
              <span>규칙 + LLM</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Music2 className="size-3.5 shrink-0 text-primary sm:size-4" />
              <span>차트·앨범 반영</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="size-3.5 shrink-0 text-primary sm:size-4" />
              <span>추천 이유 생성</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default HomePage;
