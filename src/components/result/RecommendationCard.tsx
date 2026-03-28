"use client";

import { Music, Play } from "lucide-react";
import { cn } from "@/utils/cn";
import type { PreviewSong as Song } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";

function youtubeSearchUrl(title: string, artist: string): string {
  const q = `${title} ${artist}`.trim();
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

interface RecommendationCardProps {
  song: Song;
  rank: number;
  className?: string;
}

export function RecommendationCard({
  song,
  rank,
  className,
}: RecommendationCardProps) {
  const listenHref = youtubeSearchUrl(song.title, song.artist);

  return (
    <div
      className={cn(
        "group relative rounded-2xl bg-card border border-border p-6 transition-all duration-300",
        "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
        className,
      )}
    >
      <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-lg">
        {rank}
      </div>

      <div className="flex gap-5">
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
          <div className="min-w-0">
            <h3 className="font-semibold text-lg truncate">{song.title}</h3>
            <p className="text-muted-foreground truncate">{song.artist}</p>
          </div>

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

      <div className="mt-5 pt-5 border-t border-border">
        <p className="text-xs font-medium text-muted-foreground mb-3">
          선정된 이유
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

      <div className="mt-5">
        <Button asChild className="w-full sm:w-auto">
          <a
            href={listenHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2"
          >
            <Play className="size-4 fill-current" />
            듣기
          </a>
        </Button>
      </div>
    </div>
  );
}
