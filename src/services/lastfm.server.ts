// method=track.getTopTags → 곡 태그 가져오기
// artist=... → 가수명
// track=... → 곡명
// api_key=... → 내 키
// format=json → JSON으로 받기
// autocorrect=1 → 표기 조금 달라도 보정

// --------

// Last.fm에서 곡의 top tags 가져오는 함수
export async function getTrackTopTags(track: string, artist: string) {
  const apiKey = process.env.LASTFM_API_KEY?.trim();
  if (!apiKey) {
    return [];
  }

  const url =
    `https://ws.audioscrobbler.com/2.0/?method=track.getTopTags` +
    `&artist=${encodeURIComponent(artist)}` +
    `&track=${encodeURIComponent(track)}` +
    `&api_key=${apiKey}` +
    `&format=json` +
    `&autocorrect=1`;

  const res = await fetch(url);

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Last.fm 태그 조회 실패: ${errorText}`);
  }

  const data = await res.json();

  const tagList = data.toptags?.tag ?? [];
  if (!Array.isArray(tagList)) {
    return [];
  }

  return tagList.map((tag: any) => ({
    name: tag.name,
    count: Number(tag.count ?? 0),
  }));
}

// 태그 이름만 문자열 배열로 뽑는 함수
export async function getTrackTagNames(track: string, artist: string) {
  try {
    const tags = await getTrackTopTags(track, artist);

    return tags
      .filter((tag: { name: string; count: number }) => tag.count > 0)
      .map((tag: { name: string; count: number }) => tag.name);
  } catch {
    return [];
  }
}
