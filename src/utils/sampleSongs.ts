import songs from "@/data/songs.json"
import type { PreviewSong } from "@/store/useAppStore"

function createReasons(song: (typeof songs)[number]): string[] {
  return [
    `${song.genre} 장르 선호와 잘 맞는 후보입니다.`,
    `${song.moodTags.slice(0, 2).join(", ")} 분위기를 중심으로 매칭했습니다.`,
    `${song.activityTags[0] ?? "현재 상황"} 맥락에서 자연스럽게 들을 수 있는 곡입니다.`
  ]
}

export const sampleSongs: PreviewSong[] = songs.slice(0, 5).map((song, index) => ({
  id: song.id,
  title: song.title,
  artist: song.artist,
  genre: song.genre,
  mood: song.moodTags[0] ?? "balanced",
  energy: song.energyLevel * 20,
  coverUrl: "/placeholder.svg",
  matchScore: 95 - index * 4,
  reasons: createReasons(song)
}))
