// 단계별로 잘 진행되고있는지 확인하는 백엔드 테스트 파일

// 아이튠즈 테스트
// import { searchTracks } from "@/services/itunes.server";

// export async function GET() {
//   const tracks = await searchTracks("pop");

//   return Response.json({
//     tracks,
//   });
// }

// lastfm 제대로 가져오고있는지
// import { getTrackTopTags } from "@/services/lastfm.server";

// export async function GET() {
//   const tags = await getTrackTopTags("Thinking Out Loud", "Ed Sheeran");

//   return Response.json({
//     tags,
//   });
// }
// 두 api 태그 합친 버전
import { searchTracks } from "@/services/itunes.server";

export async function GET() {
  const tracks = await searchTracks("Thinking Out Loud");

  return Response.json({
    tracks,
  });
}
