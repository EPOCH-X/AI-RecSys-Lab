"use client"

import { useEffect, useState } from "react"
import { Sparkles, Music, Brain, Wand2 } from "lucide-react"
import { cn } from "@/utils/cn"

const loadingSteps = [
  {
    icon: Brain,
    text: "취향을 분석하는 중…",
    subtext: "무드와 입력 내용을 반영하고 있어요",
  },
  {
    icon: Wand2,
    text: "잘 맞는 곡을 찾는 중…",
    subtext: "후보 곡을 살펴보고 있어요",
  },
  {
    icon: Music,
    text: "추천 곡을 고르는 중…",
    subtext: "상위 곡을 선별하고 있어요",
  },
  {
    icon: Sparkles,
    text: "마무리하는 중…",
    subtext: "선정 이유를 정리하고 있어요",
  },
]

interface LoadingAnimationProps {
  onComplete?: () => void
}

export function LoadingAnimation({ onComplete }: LoadingAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const stepDuration = 1200
    const totalSteps = loadingSteps.length

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < totalSteps - 1) {
          return prev + 1
        }
        return prev
      })
    }, stepDuration)

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 100) {
          return prev + 2
        }
        clearInterval(progressInterval)
        if (onComplete) {
          setTimeout(onComplete, 500)
        }
        return 100
      })
    }, 100)

    return () => {
      clearInterval(stepInterval)
      clearInterval(progressInterval)
    }
  }, [onComplete])

  const CurrentIcon = loadingSteps[currentStep].icon

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      {/* Animated waves background */}
      <div className="relative mb-12">
        <div className="flex items-end gap-1 h-24">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="w-2 bg-primary/30 rounded-full animate-wave"
              style={{
                height: `${30 + Math.random() * 50}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
            <CurrentIcon className="w-10 h-10 text-primary animate-pulse" />
          </div>
        </div>
      </div>

      {/* Current step text */}
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-semibold text-foreground">
          {loadingSteps[currentStep].text}
        </h2>
        <p className="text-muted-foreground">
          {loadingSteps[currentStep].subtext}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center text-sm text-muted-foreground mt-2">
          {progress}% 완료
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-4 mt-8">
        {loadingSteps.map((step, index) => {
          const StepIcon = step.icon
          return (
            <div
              key={index}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                index <= currentStep
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              <StepIcon className="w-5 h-5" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
