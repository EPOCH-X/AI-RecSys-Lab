"use client"

import { useAppStore } from "@/store/useAppStore"
import { HomePage } from "@/pages/HomePage"
import { QuestionPage } from "@/pages/QuestionPage"
import { LoadingPage } from "@/pages/LoadingPage"
import { ResultPage } from "@/pages/ResultPage"

export default function Page() {
  const { currentView } = useAppStore()

  return (
    <>
      {currentView === "home" && <HomePage />}
      {currentView === "questions" && <QuestionPage />}
      {currentView === "loading" && <LoadingPage />}
      {currentView === "results" && <ResultPage />}
    </>
  )
}
