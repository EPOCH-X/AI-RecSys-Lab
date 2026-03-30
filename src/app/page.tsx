"use client"

import { useAppStore } from "@/store/useAppStore"
import { HomePage } from "@/pages/HomePage"
import { QuestionPage } from "@/pages/QuestionPage"
import { LoadingPage } from "@/pages/LoadingPage"
import { ResultPage } from "@/pages/ResultPage"
import { ComparePage } from "@/pages/ComparePage"

export default function Page() {
  const { currentView } = useAppStore()

  return (
    <>
      {currentView === "home" && <HomePage />}
      {currentView === "questions" && <QuestionPage />}
      {currentView === "loading" && <LoadingPage />}
      {currentView === "results" && <ResultPage />}
      {currentView === "compare" && <ComparePage />}
    </>
  )
}
