import { NextResponse } from "next/server";
import type { AnswerRecord } from "@/types/question";
import type { RecommendationItem } from "@/types/graph";
import {
  freeTextPreferenceFromAnswers,
  normalizeAnswers,
  preferenceTagsFromProfile,
} from "@/domain/normalization";
import { toRecommendationItems } from "@/domain/recommendation";
import { fetchSongsForProfile } from "@/services/catalog.server";
import { enrichProfileWithFreeText } from "@/services/gemini";
import {
  ALGORITHM_COMPARE_LABELS,
  ALGORITHM_MODES,
  modeUsesMmr,
  runFullScoringForMode,
  type AlgorithmMode,
} from "@/graph/recommendationPipeline";
import { summarizeRecommendations } from "@/graph/compareMetrics";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { answers?: AnswerRecord[] };
  try {
    body = (await req.json()) as { answers?: AnswerRecord[] };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const answers = body.answers;
  if (!Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json(
      { error: "answers_required", message: "질문 답변이 필요합니다." },
      { status: 400 },
    );
  }

  try {
    let profile = normalizeAnswers(answers);
    profile = await enrichProfileWithFreeText(
      profile,
      freeTextPreferenceFromAnswers(answers),
    );
    const preferenceTags = preferenceTagsFromProfile(profile);

    const songs = await fetchSongsForProfile(profile, { perQuery: 60 });
    if (songs.length === 0) {
      return NextResponse.json(
        {
          error: "no_songs",
          message: "카탈로그에 곡이 없습니다. 답변을 바꿔 보세요.",
        },
        { status: 422 },
      );
    }

    const modes: AlgorithmMode[] = [...ALGORITHM_MODES];
    const byMode: Record<
      string,
      {
        mode: AlgorithmMode;
        title: string;
        oneLiner: string;
        detail: string;
        metrics: ReturnType<typeof summarizeRecommendations>;
        items: RecommendationItem[];
      }
    > = {};

    for (const mode of modes) {
      const scored = runFullScoringForMode(songs, profile, mode);
      const items = toRecommendationItems(scored, {
        preserveInputOrder: modeUsesMmr(mode),
        topK: 5,
      });
      const meta = ALGORITHM_COMPARE_LABELS[mode];
      byMode[mode] = {
        mode,
        title: meta.title,
        oneLiner: meta.oneLiner,
        detail: meta.detail,
        metrics: summarizeRecommendations(items),
        items,
      };
    }

    return NextResponse.json({
      profile,
      preferenceTags,
      catalogSize: songs.length,
      modes: modes.map((m) => byMode[m]),
    });
  } catch (e) {
    console.error("[recommend/compare]", e);
    const message =
      e instanceof Error ? e.message : "비교 실행 중 오류가 났습니다.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
