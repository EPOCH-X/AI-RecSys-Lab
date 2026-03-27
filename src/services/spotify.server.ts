// 스포티파이 토큰 가져오는 함수
export async function getSpotifyToken() {
  // 1. 환경변수에서 Spotify Client ID / Secret 가져오기
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

  // 2. "clientId:clientSecret" 형태를 Base64로 인코딩
  // → Spotify 인증 방식에서 필요함!
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  // 3. Spotify 토큰 발급 API 호출
  // fetch("주소", { 옵션 })
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST", // 토큰은 POST 방식으로 요청

    headers: {
      // body 데이터를 form 형식으로 보낸다는 의미
      "Content-Type": "application/x-www-form-urlencoded",

      // Authorization 헤더에 Base64 인코딩된 값 포함
      // 형식: "Basic base64(clientId:clientSecret)"
      Authorization: `Basic ${auth}`,
    },

    // 4. 어떤 방식으로 토큰 받을지 지정
    // → client_credentials 방식 (로그인 없이 사용하는 방식)
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Spotify 토큰 발급 실패: ${errorText}`);
  }

  // 5. 응답을 JSON으로 변환
  const data = await res.json();

  // 6. access_token만 반환
  return data.access_token;
}

// ---------------------------

// 곡 목록 가져오는 함수
// query는 검색어
export async function searchTracks(query: string) {
  const token = await getSpotifyToken();
  /*
https://api.spotify.com/v1/search < Spotify 검색용 주소
q=... < 검색어
type=track < 뭘 검색할지 정하는 옵션
    track 이면 곡 검색

 */
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Spotify 검색 실패: ${errorText}`);
  }

  const data = await res.json();
  //   곡 하나씩 빼서 전처리함수에 집어넣어서 리턴
  return data.tracks;
}

// -------------------------------

// // 받아온 tracks 안의 요소들 필드 정리
// export function mapSpotifyTrack(track: any) {
//   return {
//     id: track.id,
//     title: track.name,
//     // 가수 여러 명일 수도 있으니까 이름만 뽑고 ~ , ~ 형식으로 합침
//     //  ? : 있으면 넣고 없으면 쌩까라 , ??: 널값이면 대신 이거 써라
//     artist: track.artists?.map((artist: any) => artist.name).join(", ") ?? "",
//     album: track.album?.name ?? "",
//     imageUrl: track.album?.images?.[0]?.url ?? "",
//     spotifyUrl: track.external_urls?.spotify ?? "",
//     previewUrl: track.preview_url ?? null,
//   };
// }
