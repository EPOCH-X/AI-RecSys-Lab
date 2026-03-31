# AI-RecSys-Lab

Next.js, 로컬 곡 카탈로그, Gemini를 기반으로 만든 AI 음악 추천 웹 앱입니다.

## Overview

문장 입력 또는 객관식 입력을 받아 서버에서 추천 점수를 계산하는 구조입니다.

이 프로젝트는 아래 질문을 중심으로 설계되어 있습니다.

`What songs best fit the user's taste and listening context right now?`

이 질문에 답하기 위해 시스템은 다음 요소를 조합합니다.

- 두 가지 입력 모드: 자유 서술형, 구조화 선택형
- 서버 측 사용자 프로필 정규화
- `src/data/songs.json` 기반 로컬 곡 카탈로그 조회
- 규칙 기반 콘텐츠 점수 계산
- Gemini 기반 상황 보정 재정렬
- 차트 순위 및 앨범 메타데이터 가점
- 결과 카드용 추천 이유 태그 생성

## Features

현재 코드에서 실제로 동작하는 기능만 기준으로 정리했습니다.

- 홈 화면에서 두 가지 추천 진입 방식 제공
- 자연어 문장을 입력하는 Simple mode
- 장르, 분위기, 템포, 선호 가수, 연령대, 상황을 선택하는 Detailed mode
- Simple mode용 Gemini 기반 서술 해석
- `/api/recommend`를 통한 서버 측 랭킹 계산
- 상위 15곡을 5곡씩 3개 구간으로 나누어 표시
- 일치 태그, 추천 이유, YouTube 검색 링크가 포함된 결과 카드

## Recommendation Signals

현재 추천은 장르, 분위기, 템포, 가수, 연령대, 상황 정보를 중심으로 계산됩니다.

현재 파이프라인에서 직접 사용하는 주요 신호는 아래와 같습니다.

- genre: `발라드`, `댄스`, `힙합`, `R&B`, `록/밴드`, `팝`, `인디`, `OST`, `기타/애매`
- mood: `밝음`, `감성`, `신남`, `잔잔함`, `몽환`, `강렬함`, `기타/애매`
- tempo: `느림`, `보통`, `빠름`
- favorite artist: 직접 입력한 선호 가수 또는 서술형 문장에서 추출한 가수명
- listener context: 연령대와 `study`, `workout`, `relax`, `commute`, `night`, `drive` 같은 상황 값

추천 엔진은 가수, 장르, 분위기, 템포 일치에 가장 큰 직접 가중치를 주고, 이후 연령대, 듣는 상황, 차트 순위, 앨범 묶음 정보를 반영해 점수를 보정합니다.

## How It Works

입력 수집부터 결과 카드 생성까지 하나의 서버 파이프라인으로 연결됩니다.

```text
HomePage
-> SimpleRecommendPage or DetailedRecommendPage
-> LoadingPage
-> POST /api/recommend
-> buildProfile()
-> loadCatalogSongsFromJson()
-> stage1MusicalScore()
-> llmAgeSituationDeltas()
-> final score merge
-> top 15 selection with artist cap
-> ResultPage
```

파이프라인 상세 흐름은 다음과 같습니다.

1. 클라이언트가 자유 서술 입력 또는 구조화된 취향 선택값을 수집합니다.
2. API가 요청을 검증하고 정규화된 사용자 프로필을 생성합니다.
3. Simple mode에서는 Gemini가 문장에서 장르, 분위기, 템포, 선호 가수를 추출합니다.
4. 서버가 `src/data/songs.json`에서 곡 데이터를 불러옵니다.
5. 1차 단계에서 장르, 분위기, 템포, 가수, 제목 언급 여부를 기준으로 규칙 기반 점수를 계산합니다.
6. Gemini가 연령대, 분위기 선호, 듣는 상황을 반영해 2차 보정 점수를 적용합니다.
7. 차트 가점, 앨범 가점, 연령대 기반 최신곡 보정 패널티를 최종 점수에 합칩니다.
8. 동일 가수 비중을 제한한 뒤 상위 15곡을 고르고, 추천 이유와 취향 일치 태그를 구성합니다.

## Tech Stack

프론트엔드, 상태 관리, 추천 서버 로직, LLM 연동에 사용된 실제 스택입니다.

- Next.js 16
- React 19
- TypeScript
- Zustand
- Tailwind CSS 4
- Radix UI
- Gemini API
- Vercel Analytics

## Project Structure

화면, 상태, 추천 로직, 데이터 로딩 역할이 디렉터리별로 분리되어 있습니다.

```text
src/
├─ app/                    # App Router entry, layout, and API routes
│  └─ api/
│     ├─ recommend/        # Main recommendation endpoint
│     ├─ catalog/          # Catalog access endpoint
│     └─ test/             # Local catalog smoke test endpoint
├─ components/             # Shared UI, common visual components, result cards
├─ data/                   # Local songs catalog JSON
├─ domain/                 # Taste constants, normalization helpers, feedback types
├─ graph/                  # App graph state initializer
├─ pages/                  # Home, simple, detailed, loading, results views
├─ services/               # Recommendation pipeline, Gemini, catalog loading, storage keys
├─ store/                  # Zustand app state and recommendation window logic
├─ types/                  # Shared request, graph, and song types
└─ utils/                  # UI utility helpers
```

핵심 파일은 아래와 같습니다.

- `src/services/recommendationPipeline.server.ts`: 메인 추천 파이프라인
- `src/services/songsCatalog.server.ts`: 로컬 카탈로그 로더
- `src/services/gemini.ts`: Gemini JSON 호출 헬퍼
- `src/domain/tasteConstants.ts`: 허용된 취향 라벨과 상황 옵션 정의
- `src/store/useAppStore.ts`: 화면 상태 및 추천 결과 상태 관리

## Getting Started

의존성 설치와 Gemini 환경변수 설정 후 바로 실행할 수 있습니다.

### 1. Install dependencies

```bash
npm install
```

### 2. 환경변수 설정

`.env.local` 파일을 만들고 아래 값을 설정합니다.

```env
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_GEMINI_MODEL=your_preferred_gemini_model
GEMINI_MAX_OUTPUT_TOKENS=8192
```

설명:

- `GEMINI_API_KEY`는 서버 측에서 우선 사용하는 키입니다.
- `NEXT_PUBLIC_GEMINI_API_KEY`도 현재 코드에서 fallback 용도로 지원합니다.
- Gemini가 설정되지 않으면 서술형 입력 해석은 기본 휴리스틱 방식으로 대체됩니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`을 열면 됩니다.

## Available Scripts

개발 서버 실행, 프로덕션 빌드, 타입 검사용 스크립트입니다.

```bash
npm run dev
npm run build
npm run start
npm run typecheck
```

## Current Limitations

현재 버전은 로컬 카탈로그 기반이라 확장성과 실사용 측면에서 제한이 있습니다.

- 곡 소스는 외부 실시간 음악 API가 아니라 로컬 JSON 카탈로그입니다.
- Detailed mode에는 별도 자유 서술 필드가 없고, 서술형 해석은 Simple mode에서만 동작합니다.
- 피드백 타입과 저장 키는 존재하지만, 아직 랭킹에 반영되는 완전한 피드백 루프는 연결되지 않았습니다.
- 카탈로그 점수 계산은 기본적으로 규칙 기반이며, Gemini는 맥락 보정 레이어로 사용됩니다.

## Future Improvements

향후에는 실시간 카탈로그, 사용자 피드백, 평가 지표를 붙이는 방향으로 확장할 수 있습니다.

- 로컬 JSON 데이터셋을 넘어서는 실시간 음악 카탈로그 연동
- 사용자 피드백 저장 및 랭킹 반영
- 추천 품질 평가 지표 추가
- 가수 별칭, 분위기, 장르 매핑에 대한 정규화 확장
- Gemini 보조 단계의 설명 품질 및 캐싱 개선

## License

현재 저장소에는 별도 라이선스 파일이 포함되어 있지 않습니다.
