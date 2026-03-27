# System Design

## 목적

이 문서는 `develop` 브랜치에서 팀원 4명이 충돌을 최소화하면서 작업할 수 있도록, 담당별 작업 범위와 시작 파일만 정리한 작업 문서다.

설명용 내용은 `DEV_README.md`에 있고, 이 문서는 "누가 어디를 먼저 수정해야 하는지"만 본다.

## 공통 규칙

- 공통 타입 변경이 필요하면 먼저 팀에 공유하고 수정한다.
- 다른 담당 영역의 파일은 되도록 직접 수정하지 않는다.
- 꼭 공통 파일을 건드려야 하면 마지막에 머지하거나 담당자와 먼저 맞춘다.
- 우선 `src/data`, `src/types`, `src/domain`, `src/services`, `src/store`, `src/pages`, `src/components` 기준으로 역할을 나눈다.

## 현재 기본 구조

```text
src/
├─ app/
├─ components/
│  ├─ common/
│  ├─ question/
│  └─ result/
├─ data/
├─ domain/
│  ├─ feedback/
│  ├─ normalization/
│  ├─ recommendation/
│  └─ scoring/
├─ graph/
│  └─ nodes/
├─ pages/
├─ services/
├─ store/
├─ types/
└─ utils/
```

## 담당별 작업 분리

## 1. 프론트엔드 - 용완님

### 담당 목표

- 질문 화면 구현
- 로딩 화면 구현
- 결과 화면 구현
- AI API 호출 결과를 화면에 출력
- 팀원들이 만든 추천 결과를 UI에 연결

### 주 작업 폴더

- `src/pages/`
- `src/components/question/`
- `src/components/result/`
- `src/components/common/`
- `src/app/`
- `src/styles.css`

### 필요 시 읽기만 할 파일

- `src/types/graph.ts`
- `src/types/question.ts`
- `src/data/questions.ts`
- `src/store/useAppStore.ts`
- `src/services/gemini.ts`

### 먼저 시작할 파일

1. `src/pages/QuestionPage.tsx`
2. `src/components/question/QuestionCard.tsx`
3. `src/components/question/AnswerOptionList.tsx`
4. `src/components/common/ProgressBar.tsx`
5. `src/pages/ResultPage.tsx`
6. `src/components/result/RecommendationCard.tsx`
7. `src/styles.css`

### 추가 생성 권장 파일

- `src/pages/LoadingPage.tsx`
- `src/components/common/LoadingStepView.tsx`
- `src/components/result/FeedbackBar.tsx`
- `src/components/result/ResultList.tsx`

### 프론트엔드 작업 순서

1. `QuestionPage`에서 질문 1개 미리보기 상태를 실제 질문 순회 UI로 바꾼다.
2. 질문 답변 클릭, 스킵, 다음 질문 이동 UI를 만든다.
3. 로딩 화면을 따로 만들고 "AI가 추천 중" 상태를 표현한다.
4. `ResultPage`에서 추천 카드 리스트가 실제 배열을 받아 렌더링되게 만든다.
5. 추천 이유, 점수, 좋아요/싫어요 버튼 영역을 붙인다.
6. 마지막에 `App.tsx` 또는 라우팅 구조를 정리한다.

### 프론트엔드 완료 기준

- 질문 화면에서 여러 질문을 넘길 수 있다.
- 로딩 화면이 분리되어 있다.
- 결과 화면에서 추천 곡 리스트가 카드 형태로 출력된다.
- AI/추천 담당이 넘겨준 결과 배열을 그대로 받아 렌더링할 수 있다.

### 프론트엔드가 직접 건드리지 않는 것이 좋은 파일

- `src/data/songs.json`
- `src/data/users.json`
- `src/domain/scoring/`
- `src/domain/recommendation/`
- `src/domain/normalization/`

## 2. 데이터 / 추천 알고리즘 - 정은님

### 담당 목표

- 실험용 곡 데이터 구축
- 가상 사용자 선호도 데이터 구축
- 콘텐츠 기반 + 협업 필터링 로직 설계 및 구현

### 주 작업 폴더

- `src/data/`
- `src/domain/scoring/`
- `src/domain/recommendation/`

### 필요 시 읽기만 할 파일

- `src/types/song.ts`
- `src/types/user.ts`
- `src/types/graph.ts`
- `src/domain/normalization/index.ts`

### 먼저 시작할 파일

1. `src/data/songs.json`
2. `src/data/users.json`
3. `src/domain/scoring/index.ts`
4. `src/domain/recommendation/index.ts`

### 작업 내용

- `songs.json`에 곡 50~100개 수준으로 메타데이터를 채운다.
- 각 곡에는 `genre`, `bpm`, `moodTags`, `activityTags`, `hasLyrics`, `energyLevel`을 넣는다. -> 오픈API 까보면 json
- `users.json`에 가상 사용자 선호도와 `likedSongs`, `skippedSongs`를 넣는다.
- 콘텐츠 기반 점수 함수를 구현한다.
- 협업 필터링용 유사도 계산 또는 간단한 가중치 로직을 구현한다.
- 최종적으로 추천 후보 배열을 반환하는 함수를 만든다.

### 데이터/추천 완료 기준

- `songs.json`이 추천 실험 가능한 수준으로 채워져 있다.
- `users.json`이 협업 필터링 실험 가능한 수준으로 채워져 있다.
- 점수 계산 함수가 `ScoredSong[]`를 반환한다.
- 프론트엔드가 받아서 출력할 수 있는 추천 결과 배열을 만들 수 있다.

### 데이터 담당이 직접 건드리지 않는 것이 좋은 파일

- `src/pages/`
- `src/components/`
- `src/styles.css`

## 3. AI / 프롬프트 / 재정렬 - 조영님

### 담당 목표

- Gemini에 보낼 프롬프트 설계
- 스무고개 답변 + 상황 + 추천 후보를 기반으로 재정렬 구조 설계
- 추천 이유 생성 형식 설계

### 주 작업 폴더

- `src/services/gemini.ts`
- `src/domain/normalization/`
- `src/graph/`

### 필요 시 읽기만 할 파일

- `src/types/graph.ts`
- `src/types/question.ts`
- `src/data/questions.ts`
- `src/domain/recommendation/index.ts`
- `src/domain/scoring/index.ts`

### 먼저 시작할 파일

1. `src/services/gemini.ts`
2. `src/domain/normalization/index.ts`
3. `src/graph/recommendationGraph.ts`

### 작업 내용

- 프롬프트 입력 형식을 정한다.
- 자유 텍스트 답변을 태그로 바꾸는 규칙 또는 LLM 입력 형식을 만든다.
- 추천 후보 리스트를 받아 재정렬하는 입력 포맷을 만든다.
- 결과는 프론트엔드가 바로 출력할 수 있게 `reason` 포함 구조로 반환한다.
- API 실패 시 fallback 문구도 정한다.

### 권장 출력 형태

추천 결과는 아래 구조를 유지하는 것이 좋다.

```ts
{
  songId: string;
  title: string;
  artist: string;
  finalScore: number;
  reason: string;
  scoreBreakdown: {
    content: number;
    collaborative: number;
    context: number;
  }
}
```

### AI 담당 완료 기준

- 프롬프트 템플릿이 정리되어 있다.
- 추천 후보를 입력받아 이유를 포함한 결과를 반환할 수 있다.
- 재정렬 규칙 또는 LLM 호출 흐름이 문서/코드로 정리되어 있다.

### AI 담당이 직접 건드리지 않는 것이 좋은 파일

- `src/pages/`
- `src/components/`
- `src/styles.css`
- `src/data/songs.json`의 대량 데이터 직접 작성

## 4. QA / 데이터 분석 - 민승님

### 담당 목표

- 개발 완료 후 테스트 시나리오 운영
- 정량/정성 데이터 수집
- 발표용 평가 결과 정리

### 주 작업 위치

코드 수정은 많지 않다. 주로 아래를 기준으로 본다.

- `DEV_README.md`
- `SYSTEM_DESIGN.md`
- 실제 실행 화면

필요하면 결과 저장용 문서를 별도로 만든다.

### 먼저 할 일

1. 테스트 질문지/설문 문항 정리
2. 어떤 행동 데이터를 수집할지 정의
3. 결과 기록 양식 만들기

### 수집 권장 항목

- 질문 중도 이탈 여부
- 추천 결과 만족도
- 재추천 요청 여부
- 좋아요/싫어요 선택 비율
- 주관식 피드백

### QA 완료 기준

- 테스트 대상자에게 동일하게 적용할 평가 기준이 있다.
- 결과를 표나 문장으로 발표 자료에 옮길 수 있다.

## 공통 인터페이스

## 1. 공통 타입

아래 파일은 공통 기준이므로 수정 시 공유가 필요하다.

- `src/types/question.ts`
- `src/types/song.ts`
- `src/types/user.ts`
- `src/types/graph.ts`

## 2. 추천 결과 전달 형식

프론트엔드가 최종적으로 받아야 하는 최소 형식은 아래다.

```ts
interface RecommendationItem {
  songId: string;
  title: string;
  artist: string;
  finalScore: number;
  reason: string;
  scoreBreakdown: {
    content: number;
    collaborative: number;
    context: number;
  };
}
```

AI/데이터 담당은 최종적으로 이 형태로 넘겨주면 된다.

## 3. 질문 응답 형식

질문 응답은 아래 구조를 유지한다.

```ts
interface AnswerRecord {
  questionId: string;
  value: string | string[] | boolean;
  skipped?: boolean;
}
```

## 충돌 줄이는 파일 소유 기준

### 프론트엔드 전용

- `src/pages/`
- `src/components/`
- `src/styles.css`

### 데이터/추천 전용

- `src/data/`
- `src/domain/scoring/`
- `src/domain/recommendation/`

### AI 전용

- `src/services/gemini.ts`
- `src/domain/normalization/`
- `src/graph/recommendationGraph.ts`

### 공통 조심 구간

- `src/types/`
- `src/store/useAppStore.ts`
- `src/app/App.tsx`

위 파일은 한 명이 먼저 수정하면 다른 사람은 바로 건드리지 말고 맞춘 뒤 수정한다.

## develop 브랜치 작업 순서 권장

1. 정은님이 `songs.json`, `users.json`, 점수 함수부터 잡는다.
2. 조영님이 `gemini.ts`, 정규화, 재정렬 포맷을 잡는다.
3. 용완님이 질문/로딩/결과 UI를 완성한다.
4. 마지막에 공통 파일인 `store`, `App`, 타입을 한 번에 맞춘다.
5. 민승님은 기능이 붙으면 테스트와 평가를 진행한다.

## 지금 당장 각자 시작할 파일

- 용완님: `src/pages/QuestionPage.tsx`
- 정은님: `src/data/songs.json`
- 조영님: `src/services/gemini.ts`
- 민승님: 테스트 항목 문서 작성

## 변경 이력

### 2026-03-24

- 기존 본문은 유지하고, 현재 프론트엔드 이식 상태만 하단에 기록한다.
- 프론트엔드 실행 엔트리는 `src/app/page.tsx`, `src/app/layout.tsx`로 동작하지만, 실제 작업 폴더는 기존 분업 원칙을 유지하도록 `src/pages/`, `src/components/common/`, `src/components/question/`, `src/components/result/`, `src/store/`, `src/utils/` 중심으로 맞췄다.
- 따라서 프론트 담당자는 계속 `src/pages/QuestionPage.tsx`, `src/pages/ResultPage.tsx`, `src/pages/LoadingPage.tsx`, `src/components/common/`, `src/components/question/`, `src/components/result/`, `src/styles.css`, `src/store/useAppStore.ts`를 주 작업 위치로 보면 된다.
- `src/data/`, `src/domain/`, `src/graph/`, `src/services/`, `src/types/`는 다른 담당 영역 보호를 위해 구조를 유지했다.
- 공통 조심 구간은 기존과 동일하게 `src/types/`, `src/store/useAppStore.ts`이며, 현재는 `src/app/App.tsx` 대신 `src/app/page.tsx`가 프론트엔드 진입점 역할을 한다.
