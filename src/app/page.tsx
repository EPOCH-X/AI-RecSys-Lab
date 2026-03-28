"use client"

import { useAppStore } from "@/store/useAppStore"
import { HomePage } from "@/pages/HomePage"
import { SimpleRecommendPage } from "@/pages/SimpleRecommendPage"
import { DetailedRecommendPage } from "@/pages/DetailedRecommendPage"
import { QuestionPage } from "@/pages/QuestionPage"
import { LoadingPage } from "@/pages/LoadingPage"
import { ResultPage } from "@/pages/ResultPage"

export default function Page() {
  const { currentView } = useAppStore()

  return (
    <>
      {currentView === "home" && <HomePage />}
      {currentView === "simple" && <SimpleRecommendPage />}
      {currentView === "detailed" && <DetailedRecommendPage />}
      {currentView === "questions" && <QuestionPage />}
      {currentView === "loading" && <LoadingPage />}
      {currentView === "results" && <ResultPage />}
    </>
  )
}
