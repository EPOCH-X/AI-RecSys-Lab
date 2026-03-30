"use client";

import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AGE_RANGES, SITUATION_OPTIONS } from "@/domain/tasteConstants";

export function SimpleRecommendPage() {
  const { setCurrentView, setRecommendRequest } = useAppStore();
  const [narrative, setNarrative] = useState("");
  const [ageRange, setAgeRange] = useState<string>(AGE_RANGES[1] ?? "20대");
  const [situation, setSituation] = useState<string>(
    SITUATION_OPTIONS[0]?.value ?? "study",
  );

  const handleSubmit = () => {
    const text = narrative.trim();
    if (text.length < 2) return;
    setRecommendRequest({
      mode: "simple",
      narrative: text,
      ageRange,
      situation,
    });
    setCurrentView("loading");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => setCurrentView("home")}
            aria-label="홈으로"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-lg font-semibold">간단하게 추천받기</h1>
        </div>
      </header>

      <main className="flex-1 px-6 py-10">
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle className="text-base font-medium">
              듣고 싶은 음악을 문장으로 적어 주세요
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              장르·분위기·가수 등은 자유롭게 서술해 주세요. 연령과 듣는 상황도
              함께 선택해 주세요.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="narrative">요청 내용</Label>
              <Textarea
                id="narrative"
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                placeholder="예: 밤에 혼자 듣기 좋은 잔잔한 발라드가 듣고 싶어요."
                className="min-h-[140px] resize-y"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>연령대</Label>
                <Select value={ageRange} onValueChange={setAgeRange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_RANGES.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>듣는 상황</Label>
                <Select value={situation} onValueChange={setSituation}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {SITUATION_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              type="button"
              disabled={narrative.trim().length < 2}
              onClick={handleSubmit}
            >
              추천 받기
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default SimpleRecommendPage;
