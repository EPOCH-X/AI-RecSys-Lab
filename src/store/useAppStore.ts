import { create } from "zustand";
import { createInitialGraphState } from "../graph/questionGraph";
import type {
  AppGraphState,
  RecommendationItem,
  SessionStatus,
} from "../types/graph";
import type { RecommendRequestBody } from "../types/recommendRequest";

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

type CurrentView = "home" | "simple" | "detailed" | "loading" | "results";

const WINDOW_SIZE = 5;
const WINDOW_COUNT = 3;

interface AppState {
  currentView: CurrentView;
  setCurrentView: (view: CurrentView) => void;
  recommendRequest: RecommendRequestBody | null;
  setRecommendRequest: (body: RecommendRequestBody | null) => void;
  resetAnswers: () => void;
  /** 상위 15곡 풀 (1~15위); 화면에는 구간별로 5곡씩 */
  recommendationPool: PreviewSong[];
  /** 0: 1~5, 1: 6~10, 2: 11~15 */
  recommendationWindowIndex: number;
  cycleRecommendationWindow: () => void;
  graphState: AppGraphState;
  setGraphState: (nextState: AppGraphState) => void;
  patchGraphState: (patch: Partial<AppGraphState>) => void;
  setSessionStatus: (status: SessionStatus) => void;
  setErrorMessage: (message?: string) => void;
  applyRecommendationItems: (
    items: RecommendationItem[],
    graphExtras?: Partial<AppGraphState>,
  ) => void;
  clearRecommendationPool: () => void;
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
  resetAnswers: () =>
    set({
      currentView: "home",
      recommendationPool: [],
      recommendationWindowIndex: 0,
      recommendRequest: null,
      graphState: {
        ...createInitialGraphState(),
        sessionStatus: "idle",
      },
    }),
  recommendationPool: [],
  recommendationWindowIndex: 0,
  cycleRecommendationWindow: () =>
    set((state) => ({
      recommendationWindowIndex:
        (state.recommendationWindowIndex + 1) % WINDOW_COUNT,
    })),
  clearRecommendationPool: () =>
    set({ recommendationPool: [], recommendationWindowIndex: 0 }),

  graphState: createInitialGraphState(),
  setGraphState: (nextState) => set({ graphState: nextState }),
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
  applyRecommendationItems: (items, graphExtras) =>
    set((state) => ({
      recommendationPool: createPreviewSongs(items),
      recommendationWindowIndex: 0,
      currentView: "results",
      graphState: {
        ...state.graphState,
        ...graphExtras,
        finalRecommendations: items,
        sessionStatus: "done",
        errorMessage: undefined,
      },
    })),
}));

export function getVisibleRecommendations(
  pool: PreviewSong[],
  windowIndex: number,
): PreviewSong[] {
  const start = windowIndex * WINDOW_SIZE;
  return pool.slice(start, start + WINDOW_SIZE);
}

export function rankRangeLabel(
  windowIndex: number,
  poolLength: number,
): string {
  if (poolLength <= 0) return "";
  const start = windowIndex * WINDOW_SIZE + 1;
  const end = Math.min((windowIndex + 1) * WINDOW_SIZE, poolLength);
  if (start > poolLength) return `${poolLength}위까지`;
  return `${start}~${end}위`;
}

export { WINDOW_SIZE, WINDOW_COUNT };
