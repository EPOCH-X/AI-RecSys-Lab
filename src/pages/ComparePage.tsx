"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  ClipboardCopy,
  Loader2,
  Rows3,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RecommendationItem } from "@/types/graph";

type CompareModePayload = {
  mode: string;
  title: string;
  oneLiner: string;
  detail: string;
  metrics: {
    topK: number;
    distinctGenres: number;
    distinctArtists: number;
    avgFinalScore: number;
  };
  items: RecommendationItem[];
};

type CompareApiResponse = {
  profile: unknown;
  preferenceTags: string[];
  catalogSize: number;
  modes: CompareModePayload[];
};

function buildPresentationMarkdown(res: CompareApiResponse): string {
  const header = [
    "| 알고리즘 | 한 줄 설명 | 장르 수(서로 다름) | 아티스트 수 | 평균 점수 |",
    "|---|---:|---:|---:|---:|",
  ];
  const rows = res.modes.map((m) => {
    const g = m.metrics.distinctGenres;
    const a = m.metrics.distinctArtists;
    const s = m.metrics.avgFinalScore;
    return `| ${m.title} | ${m.oneLiner} | ${g} | ${a} | ${s} |`;
  });
  const songs = res.modes
    .map((m) => {
      const lines = m.items.map(
        (it, i) =>
          `${i + 1}. **${it.title}** — ${it.artist} (${it.genre ?? "—"}) · ${it.finalScore.toFixed(2)}`,
      );
      return `### ${m.title}\n${lines.join("\n")}`;
    })
    .join("\n\n");
  return [
    "## 알고리즘 비교 요약",
    "",
    `- 카탈로그 후보 곡 수: **${res.catalogSize}**`,
    `- 프로필 태그: ${res.preferenceTags.join(", ") || "—"}`,
    "",
    ...header,
    ...rows,
    "",
    "## Top-5 곡 목록",
    "",
    songs,
    "",
  ].join("\n");
}

export function ComparePage() {
  const { getAnswerRecords, setCurrentView, answers } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CompareApiResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const canRun = answers.length > 0;

  const runCompare = useCallback(async () => {
    setError(null);
    setData(null);
    setLoading(true);
    try {
      const payload = { answers: getAnswerRecords() };
      const res = await fetch("/api/recommend/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as CompareApiResponse & {
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        throw new Error(
          json.message ?? json.error ?? `요청 실패 (${res.status})`,
        );
      }
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "비교 요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [getAnswerRecords]);

  const markdown = useMemo(
    () => (data ? buildPresentationMarkdown(data) : ""),
    [data],
  );

  const copyMd = useCallback(async () => {
    if (!markdown) return;
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [markdown]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              발표용 · 알고리즘 비교
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
              한 화면에서 4가지 추천 방식 비교
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              동일한 질문 답변·동일한 카탈로그로 Baseline, Cosine, Cosine+MMR,
              Hybrid+MMR을 동시에 계산합니다. 아래 표와 마크다운 복사로 슬라이드
              초안을 바로 만들 수 있습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentView("results")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              결과로 돌아가기
            </Button>
            <Button
              size="sm"
              disabled={!canRun || loading}
              onClick={() => void runCompare()}
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BarChart3 className="h-4 w-4" />
              )}
              비교 실행
            </Button>
          </div>
        </div>

        {!canRun && (
          <Card className="mb-8 border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">답변이 없습니다</CardTitle>
              <CardDescription>
                홈에서 질문에 답하고 추천까지 받은 뒤, 이 페이지에서 비교를
                실행하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setCurrentView("home")}>홈으로</Button>
            </CardContent>
          </Card>
        )}

        {error && (
          <div
            className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        )}

        {data && (
          <>
            <Card className="mb-6 overflow-hidden">
              <CardHeader className="border-b bg-muted/40">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Rows3 className="h-5 w-5 text-primary" />
                      요약 지표 (Top-5 기준)
                    </CardTitle>
                    <CardDescription>
                      장르·아티스트 다양성이 높을수록 MMR 계열에서 발표하기
                      좋은 “다양성” 스토리를 만들기 쉽습니다.
                    </CardDescription>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-2 shrink-0"
                    onClick={() => void copyMd()}
                  >
                    <ClipboardCopy className="h-4 w-4" />
                    {copied ? "복사됨" : "발표용 마크다운 복사"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b bg-muted/20 text-left">
                        <th className="px-4 py-3 font-semibold">알고리즘</th>
                        <th className="px-4 py-3 font-semibold">설명</th>
                        <th className="px-4 py-3 text-right font-semibold">
                          장르 수
                        </th>
                        <th className="px-4 py-3 text-right font-semibold">
                          아티스트 수
                        </th>
                        <th className="px-4 py-3 text-right font-semibold">
                          평균 점수
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.modes.map((m) => (
                        <tr
                          key={m.mode}
                          className="border-b last:border-0 hover:bg-muted/30"
                        >
                          <td className="px-4 py-3 font-medium">{m.title}</td>
                          <td className="max-w-xs px-4 py-3 text-muted-foreground">
                            {m.oneLiner}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {m.metrics.distinctGenres}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {m.metrics.distinctArtists}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {m.metrics.avgFinalScore}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="border-t px-4 py-2 text-xs text-muted-foreground">
                  카탈로그 후보: <strong>{data.catalogSize}</strong>곡 · 태그:{" "}
                  {data.preferenceTags.join(", ") || "—"}
                </p>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
              {data.modes.map((m) => (
                <Card
                  key={m.mode}
                  className="flex flex-col border-primary/15 shadow-sm"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base leading-snug">
                      {m.title}
                    </CardTitle>
                    <CardDescription className="text-xs leading-relaxed">
                      {m.detail}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-2 pt-0">
                    <ol className="flex flex-1 list-decimal gap-2 pl-4 text-sm space-y-2">
                      {m.items.map((it) => (
                        <li key={it.songId} className="pl-1">
                          <span className="font-medium leading-tight">
                            {it.title}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {it.artist}
                            {it.genre ? ` · ${it.genre}` : ""} ·{" "}
                            {it.finalScore.toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              ))}
            </div>

            <details className="mt-8 rounded-lg border bg-card p-4 text-sm">
              <summary className="cursor-pointer font-medium">
                발표용 마크다운 미리보기
              </summary>
              <pre className="mt-3 max-h-[320px] overflow-auto whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-xs">
                {markdown}
              </pre>
            </details>
          </>
        )}
      </div>
    </div>
  );
}

export default ComparePage;
