"use client"

import { Heart, ThumbsDown, Music, Sparkles } from "lucide-react"
import { cn } from "@/utils/cn"
import type { PreviewSong as Song } from "@/store/useAppStore"

interface RecommendationCardProps {
  song: Song
  rank: number
  isLiked: boolean
  isDisliked: boolean
  onLike: () => void
  onDislike: () => void
  className?: string
}

export function RecommendationCard({
  song,
  rank,
  isLiked,
  isDisliked,
  onLike,
  onDislike,
  className,
}: RecommendationCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-2xl bg-card border border-border p-6 transition-all duration-300",
        "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
        className
      )}
    >
      {/* Rank badge */}
      <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-lg">
        {rank}
      </div>

      <div className="flex gap-5">
        {/* Album art */}
        <div className="relative w-24 h-24 rounded-xl bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
          {song.coverUrl.startsWith("http") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={song.coverUrl}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <Music className="w-10 h-10 text-muted-foreground" />
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Song info */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-lg truncate">{song.title}</h3>
              <p className="text-muted-foreground truncate">{song.artist}</p>
            </div>

            {/* Match score */}
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary shrink-0">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">{song.matchScore}%</span>
            </div>
          </div>

          {/* Genre & mood tags */}
          <div className="flex gap-2 mt-3">
            <span className="px-2 py-1 text-xs rounded-md bg-secondary text-secondary-foreground">
              {song.genre}
            </span>
            <span className="px-2 py-1 text-xs rounded-md bg-secondary text-secondary-foreground">
              {song.mood}
            </span>
          </div>
        </div>
      </div>

      {/* AI reasons */}
      <div className="mt-5 pt-5 border-t border-border">
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
          Why this track?
        </p>
        <ul className="space-y-2">
          {song.reasons.map((reason, index) => (
            <li
              key={index}
              className="flex items-start gap-2 text-sm text-muted-foreground"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Feedback actions */}
      <div className="flex items-center gap-3 mt-5">
        <button
          onClick={onLike}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            isLiked
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-primary/20"
          )}
        >
          <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
          Like
        </button>
        <button
          onClick={onDislike}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            isDisliked
              ? "bg-destructive text-destructive-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-destructive/20"
          )}
        >
          <ThumbsDown className={cn("w-4 h-4", isDisliked && "fill-current")} />
          Not for me
        </button>
      </div>
    </div>
  )
}
