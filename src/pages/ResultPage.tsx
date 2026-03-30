"use client";

import { Home, RefreshCw, CheckCircle, BarChart3 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { RecommendationCard } from "@/components/result/RecommendationCard";
import { Button } from "@/components/ui/button";

export function ResultPage() {
  const {
    recommendations,
    answers,
    likedSongs,
    dislikedSongs,
    toggleLike,
    toggleDislike,
    setCurrentView,
    resetAnswers,
  } = useAppStore();

  const handleStartOver = () => {
    resetAnswers();
    setCurrentView("home");
  };

  const handleTryAgain = () => {
    resetAnswers();
    setCurrentView("questions");
  };

  // Generate a summary of user answers
  const answerSummary = answers
    .map(
      (a) =>
        `${a.questionTitle}: ${a.skipped ? "Skip" : (a.displayAnswer ?? a.answer)}`,
    )
    .join(" • ");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Your Recommendations</h1>
              <p className="text-sm text-muted-foreground">
                Based on your preferences
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleStartOver}>
              <Home className="w-5 h-5" />
              <span className="sr-only">Go home</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Results content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Answer summary card */}
          <div className="mb-8 p-4 rounded-xl bg-card border border-border">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-medium mb-1">Your Profile</h2>
                <p className="text-sm text-muted-foreground">{answerSummary}</p>
              </div>
            </div>
          </div>

          {/* Recommendation cards */}
          <div className="space-y-6">
            {recommendations.map((song, index) => (
              <RecommendationCard
                key={song.id}
                song={song}
                rank={index + 1}
                isLiked={likedSongs.includes(song.id)}
                isDisliked={dislikedSongs.includes(song.id)}
                onLike={() => toggleLike(song.id)}
                onDislike={() => toggleDislike(song.id)}
              />
            ))}
          </div>

          {/* Empty state */}
          {recommendations.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">
                No recommendations yet. Start by answering some questions!
              </p>
              <Button onClick={handleTryAgain}>Start Questionnaire</Button>
            </div>
          )}
        </div>
      </main>

      {/* Footer with actions */}
      <footer className="border-t border-border px-6 py-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            {likedSongs.length > 0 && (
              <span>
                {likedSongs.length} song{likedSongs.length !== 1 && "s"} liked
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="secondary"
              onClick={() => setCurrentView("compare")}
              className="gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              알고리즘 비교 (발표용)
            </Button>
            <Button variant="outline" onClick={handleTryAgain}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Different Answers
            </Button>
            <Button onClick={handleStartOver}>Back to Home</Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ResultPage;
