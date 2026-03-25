"use client"

import { cn } from "@/utils/cn"

interface AnswerChipProps {
  label: string
  selected?: boolean
  onClick: () => void
  className?: string
}

export function AnswerChip({
  label,
  selected,
  onClick,
  className,
}: AnswerChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-6 py-4 rounded-xl text-base font-medium transition-all duration-200",
        "border border-border hover:border-primary/50",
        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background",
        selected
          ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
          : "bg-card text-card-foreground hover:bg-secondary",
        className
      )}
    >
      {label}
    </button>
  )
}
