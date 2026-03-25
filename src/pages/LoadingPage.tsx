"use client"

import { useAppStore } from "@/store/useAppStore"
import { sampleSongs } from "@/utils/sampleSongs"
import { LoadingAnimation } from "@/components/common/LoadingAnimation"

export function LoadingPage() {
  const { setCurrentView, setRecommendations } = useAppStore()

  const handleComplete = () => {
    // In a real app, this would call the recommendation engine
    // For the prototype, we use sample data
    setRecommendations(sampleSongs)
    setCurrentView("results")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingAnimation onComplete={handleComplete} />
    </div>
  )
}

export default LoadingPage
