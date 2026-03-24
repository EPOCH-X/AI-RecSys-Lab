"use client"

import { ArrowRight, Sparkles, Music2, Brain, MessageCircle } from "lucide-react"
import { useAppStore } from "@/store/useAppStore"
import { Button } from "@/components/ui/button"

export function HomePage() {
  const { setCurrentView, resetAnswers } = useAppStore()

  const handleStart = () => {
    resetAnswers()
    setCurrentView("questions")
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* Brand */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            AI-Powered Music Discovery
          </div>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
            Find Your{" "}
            <span className="text-primary">Perfect Soundtrack</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto text-pretty">
            Answer a few simple questions about your mood, moment, and taste. 
            Our AI will find the music that fits you right now.
          </p>

          {/* CTA */}
          <div className="pt-4">
            <Button
              size="lg"
              onClick={handleStart}
              className="px-8 py-6 text-lg rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
            >
              Start Your Journey
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Quick stats */}
          <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              <span>5 Questions</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              <span>AI Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <Music2 className="w-4 h-4 text-primary" />
              <span>Curated Picks</span>
            </div>
          </div>
        </div>
      </main>

      {/* How it works section */}
      <section className="border-t border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-semibold text-center mb-12">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <MessageCircle className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Answer Questions</h3>
              <p className="text-muted-foreground text-sm">
                Tell us about your current mood, what you are doing, and the vibe you want.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <Brain className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">AI Analyzes</h3>
              <p className="text-muted-foreground text-sm">
                Our hybrid recommendation engine matches your preferences with thousands of tracks.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Get Recommendations</h3>
              <p className="text-muted-foreground text-sm">
                Receive personalized picks with AI-generated explanations for why each track fits you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Music2 className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">MoodTune AI</span>
          </div>
          <p>Question-based AI music recommendation prototype</p>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
