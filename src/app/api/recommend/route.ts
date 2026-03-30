import { NextResponse } from "next/server";
import {
  runRecommendationPipeline,
  validateRecommendRequest,
} from "@/services/recommendationPipeline.server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!validateRecommendRequest(body)) {
    return NextResponse.json(
      { error: "요청 형식이 올바르지 않습니다. 필수 항목을 확인해 주세요." },
      { status: 400 },
    );
  }

  try {
    const { profile, preferenceTags, items } =
      await runRecommendationPipeline(body);
    return NextResponse.json({
      profile,
      preferenceTags,
      items,
    });
  } catch (e) {
    console.error("[api/recommend]", e);
    const message =
      e instanceof Error ? e.message : "추천을 생성하지 못했습니다.";
    return NextResponse.json({ error: message, items: [] }, { status: 502 });
  }
}
