"use client";

import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AGE_RANGES,
  SITUATION_OPTIONS,
  TASTE_GENRES,
  TASTE_MOODS,
  TASTE_TEMPOS,
  TEMPO_NONE_LABEL,
  TEMPO_NONE_VALUE,
} from "@/domain/tasteConstants";

export function DetailedRecommendPage() {
  const { setCurrentView, setRecommendRequest } = useAppStore();
  const [genre, setGenre] = useState<string>(TASTE_GENRES[0] ?? "발라드");
  const [mood, setMood] = useState<string>(TASTE_MOODS[0] ?? "잔잔함");
  const [tempo, setTempo] = useState<string>(TEMPO_NONE_VALUE);
  const [artist, setArtist] = useState("");
  const [ageRange, setAgeRange] = useState<string>(AGE_RANGES[1] ?? "20대");
  const [situation, setSituation] = useState<string>(
    SITUATION_OPTIONS[0]?.value ?? "study",
  );

  const handleSubmit = () => {
    setRecommendRequest({
      mode: "detailed",
      genre,
      mood,
      ...(tempo !== TEMPO_NONE_VALUE ? { tempo } : {}),
      artist: artist.trim() || undefined,
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
          <h1 className="text-lg font-semibold">상세하게 추천받기</h1>
        </div>
      </header>

      <main className="flex-1 px-6 py-10">
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle className="text-base font-medium">
              한 화면에서 취향을 선택하세요
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>장르</Label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASTE_GENRES.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>분위기</Label>
                <Select value={mood} onValueChange={setMood}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASTE_MOODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>템포</Label>
                <Select value={tempo} onValueChange={setTempo}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={TEMPO_NONE_LABEL} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TEMPO_NONE_VALUE}>
                      {TEMPO_NONE_LABEL}
                    </SelectItem>
                    {TASTE_TEMPOS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="artist">선호 가수 (선택)</Label>
                <Input
                  id="artist"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="예: 아이유"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>연령대</Label>
                <Select value={ageRange} onValueChange={setAgeRange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
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
                    <SelectValue />
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

            <Button className="w-full" size="lg" type="button" onClick={handleSubmit}>
              추천 받기
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default DetailedRecommendPage;
