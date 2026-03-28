import { create } from "zustand";
import { createInitialGraphState } from "../graph/questionGraph";
import type {
  AppGraphState,
  RecommendationItem,
  SessionStatus,
} from "../types/graph";
import type { AnswerRecord } from "../types/question";
import type { RecommendRequestBody } from "../types/recommendRequest";

export interface Answer {
  questionId: string;
  questionTitle: string;
  answer: string;
  displayAnswer?: string;
  skipped?: boolean;
}

export interface PreviewSong {
  id: string;
  title: string;
  artist: string;
  energy: number;
  coverUrl: string;
  matchScore: number;
  /** 입력과 일치해 반영된 취향 뱃지(장르·분위기·템포 등) */
  tasteMatchTags: string[];
  /** 카드에 bullet로 표시 (fitFactors 우선) */
  reasons: string[];
}

type CurrentView =
  | "home"
  | "simple"
  | "detailed"
  | "questions"
  | "loading"
  | "results";

interface AppState {
  currentView: CurrentView;
  setCurrentView: (view: CurrentView) => void;
  recommendRequest: RecommendRequestBody | null;
  setRecommendRequest: (body: RecommendRequestBody | null) => void;
  currentQuestionIndex: number;
  answers: Answer[];
  setCurrentQuestionIndex: (index: number) => void;
  addAnswer: (answer: Answer) => void;
  setAnswers: (answers: Answer[]) => void;
  resetAnswers: () => void;
  recommendations: PreviewSong[];
  setRecommendations: (songs: PreviewSong[]) => void;

  graphState: AppGraphState;
  setGraphState: (nextState: AppGraphState) => void;
  patchGraphState: (patch: Partial<AppGraphState>) => void;
  setSessionStatus: (status: SessionStatus) => void;
  setErrorMessage: (message?: string) => void;
  syncQuestionProgress: () => void;
  syncAnswersToGraph: () => void;
  applyRecommendationItems: (
    items: RecommendationItem[],
    graphExtras?: Partial<AppGraphState>,
  ) => void;
  getAnswerRecords: () => AnswerRecord[];
}

const initialGraphState = createInitialGraphState();

function toAnswerRecord(answer: Answer): AnswerRecord {
  return {
    questionId: answer.questionId,
    value: answer.answer,
    skipped: answer.skipped,
  };
}

function createPreviewSongs(items: RecommendationItem[]): PreviewSong[] {
  return items.map((item) => {
    const match = Math.min(100, Math.max(0, Math.round(item.finalScore * 10)));
    const fromFactors =
      item.fitFactors?.filter((s) => s.trim().length > 0) ?? [];
    const reasonText = item.reason?.trim() ?? "";
    const reasons =
      fromFactors.length > 0
        ? fromFactors
        : reasonText
          ? [reasonText]
          : ["선정 요인을 불러오지 못했습니다."];
    return {
      id: item.songId,
      title: item.title,
      artist: item.artist,
      energy: match,
      coverUrl: item.coverUrl?.trim() || "/placeholder.svg",
      matchScore: match,
      tasteMatchTags: item.tasteMatchTags?.filter((s) => s.trim()) ?? [],
      reasons,
    };
  });
}

export const useAppStore = create<AppState>((set, get) => ({
  currentView: "home",
  setCurrentView: (view) => set({ currentView: view }),
  recommendRequest: null,
  setRecommendRequest: (body) => set({ recommendRequest: body }),
  currentQuestionIndex: 0,
  answers: [],
  setCurrentQuestionIndex: (index) => {
    set((state) => ({
      currentQuestionIndex: index,
      graphState: {
        ...state.graphState,
        currentQuestionIndex: index,
      },
    }));
  },
  addAnswer: (answer) =>
    set((state) => {
      const existingIndex = state.answers.findIndex(
        (item) => item.questionId === answer.questionId,
      );
      const nextAnswers =
        existingIndex >= 0
          ? state.answers.map((item, index) =>
              index === existingIndex ? answer : item,
            )
          : [...state.answers, answer];

      return {
        answers: nextAnswers,
        graphState: {
          ...state.graphState,
          answers: nextAnswers.map(toAnswerRecord),
        },
      };
    }),
  setAnswers: (answers) =>
    set((state) => ({
      answers,
      graphState: {
        ...state.graphState,
        answers: answers.map(toAnswerRecord),
      },
    })),
  resetAnswers: () =>
    set({
      currentView: "home",
      currentQuestionIndex: 0,
      answers: [],
      recommendations: [],
      recommendRequest: null,
      graphState: {
        ...createInitialGraphState(),
        sessionStatus: "idle",
      },
    }),
  recommendations: [],
  setRecommendations: (songs) => set({ recommendations: songs }),

  graphState: initialGraphState,
  setGraphState: (nextState) =>
    set({
      graphState: nextState,
      currentQuestionIndex: nextState.currentQuestionIndex,
    }),
  patchGraphState: (patch) =>
    set((state) => ({
      graphState: {
        ...state.graphState,
        ...patch,
      },
    })),
  setSessionStatus: (status) =>
    set((state) => ({
      graphState: {
        ...state.graphState,
        sessionStatus: status,
      },
    })),
  setErrorMessage: (message) =>
    set((state) => ({
      graphState: {
        ...state.graphState,
        errorMessage: message,
        sessionStatus: message ? "error" : state.graphState.sessionStatus,
      },
    })),
  syncQuestionProgress: () =>
    set((state) => ({
      graphState: {
        ...state.graphState,
        currentQuestionIndex: state.currentQuestionIndex,
      },
    })),
  syncAnswersToGraph: () =>
    set((state) => ({
      graphState: {
        ...state.graphState,
        answers: state.answers.map(toAnswerRecord),
      },
    })),
  applyRecommendationItems: (items, graphExtras) =>
    set((state) => ({
      recommendations: createPreviewSongs(items),
      currentView: "results",
      graphState: {
        ...state.graphState,
        ...graphExtras,
        finalRecommendations: items,
        sessionStatus: "done",
        errorMessage: undefined,
      },
    })),
  getAnswerRecords: () => get().answers.map(toAnswerRecord),
}));
