"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { questions } from "@/utils/questionView";
import { ProgressBar } from "@/components/common/ProgressBar";
import { AnswerChip } from "@/components/question/AnswerChip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/utils/cn";

export function QuestionPage() {
  const {
    currentQuestionIndex,
    answers,
    setCurrentQuestionIndex,
    addAnswer,
    setCurrentView,
  } = useAppStore();

  const [inputValue, setInputValue] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const isTextQuestion = currentQuestion?.type === "text";

  // Load existing answer when navigating back
  useEffect(() => {
    const existingAnswer = answers.find(
      (a) => a.questionId === currentQuestion?.id,
    );
    if (existingAnswer) {
      setInputValue(existingAnswer.answer);
    } else {
      setInputValue("");
    }
  }, [currentQuestionIndex, answers, currentQuestion?.id]);

  // Auto-focus textarea on question change
  useEffect(() => {
    if (textareaRef.current && !isTransitioning) {
      textareaRef.current.focus();
    }
  }, [currentQuestionIndex, isTransitioning]);

  const handleSubmit = () => {
    if (!inputValue.trim()) return;

    setIsTransitioning(true);

    addAnswer({
      questionId: currentQuestion.id,
      questionTitle: currentQuestion.text,
      answer: inputValue.trim(),
      displayAnswer: inputValue.trim(),
    });

    setTimeout(() => {
      if (isLastQuestion) {
        setCurrentView("loading");
      } else {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
      setIsTransitioning(false);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      setCurrentView("home");
    }
  };

  const handleSkip = () => {
    setIsTransitioning(true);

    addAnswer({
      questionId: currentQuestion.id,
      questionTitle: currentQuestion.text,
      answer: "",
      displayAnswer: "",
      skipped: true,
    });

    setTimeout(() => {
      if (isLastQuestion) {
        setCurrentView("loading");
      } else {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
      setIsTransitioning(false);
    }, 300);
  };

  if (!currentQuestion) {
    return null;
  }

  const handleOptionSelect = (value: string, label: string) => {
    setIsTransitioning(true);

    addAnswer({
      questionId: currentQuestion.id,
      questionTitle: currentQuestion.text,
      answer: value,
      displayAnswer: label,
    });

    setTimeout(() => {
      if (isLastQuestion) {
        setCurrentView("loading");
      } else {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
      setIsTransitioning(false);
    }, 300);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with progress */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="sr-only">Go back</span>
            </Button>
            <span className="text-sm font-medium text-primary uppercase tracking-wide">
              {currentQuestion.category}
            </span>
          </div>
          <ProgressBar
            current={currentQuestionIndex + 1}
            total={totalQuestions}
          />
        </div>
      </header>

      {/* Question content */}
      <main className="flex-1 flex flex-col justify-center px-6 py-12">
        <div className="max-w-2xl mx-auto w-full">
          <div
            className={cn(
              "transition-all duration-300",
              isTransitioning
                ? "opacity-0 translate-y-4"
                : "opacity-100 translate-y-0",
            )}
          >
            {/* Question text */}
            <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-balance">
              {currentQuestion.text}
            </h1>

            <div className="space-y-4">
              {isTextQuestion ? (
                <>
                  <Textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={currentQuestion.placeholder}
                    className="min-h-[140px] text-lg bg-card border-border resize-none focus:ring-2 focus:ring-primary/50"
                  />

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleSubmit}
                      disabled={!inputValue.trim()}
                      className="flex-1 sm:flex-none"
                    >
                      {isLastQuestion ? "Get Recommendations" : "Next"}
                      {isLastQuestion ? (
                        <Send className="w-4 h-4 ml-2" />
                      ) : (
                        <ArrowRight className="w-4 h-4 ml-2" />
                      )}
                    </Button>

                    {currentQuestion.skippable ? (
                      <Button
                        variant="ghost"
                        onClick={handleSkip}
                        className="text-muted-foreground"
                      >
                        Skip this question
                      </Button>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {currentQuestion.options?.map((option) => (
                      <AnswerChip
                        key={option.id}
                        label={option.label}
                        onClick={() =>
                          handleOptionSelect(option.value, option.label)
                        }
                      />
                    ))}
                  </div>

                  {currentQuestion.skippable ? (
                    <div className="pt-2">
                      <Button
                        variant="ghost"
                        onClick={handleSkip}
                        className="text-muted-foreground"
                      >
                        Skip this question
                      </Button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default QuestionPage;
