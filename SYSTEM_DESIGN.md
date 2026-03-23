# System Design

## Akinator-Style AI Music Recommender

> `DEV_README.md`를 구현 가능한 수준으로 구체화한 상세 설계 문서

## 1. 설계 목표

이 문서는 아래 목적을 위해 작성한다.

- 팀원이 같은 구조를 기준으로 병렬 개발할 수 있도록 한다.
- 질문 흐름과 추천 흐름을 명확히 분리한다.
- 프론트엔드 단독 프로토타입으로 빠르게 구현 가능하도록 범위를 제한한다.
- 이후 서버리스/백엔드 구조로 확장 가능한 인터페이스를 남긴다.

## 2. 범위

### 포함

- React + Vite + TypeScript 기반 SPA
- 질문 기반 취향 수집 UI
- LangGraph를 활용한 질문 플로우 및 추천 플로우
- 로컬 JSON 기반 추천 실험
- Gemini를 이용한 추천 이유 생성
- 로컬 스토리지 기반 세션/피드백 저장

### 제외

- 사용자 로그인
- 실제 스트리밍 서비스 연동
- 대규모 추천 데이터 파이프라인
- 운영 환경 보안 아키텍처

## 3. 상위 아키텍처

```text
[UI Layer]
Home / Question / Result
        |
        v
[App State Layer]
Zustand or Context + local component state
        |
        v
[Workflow Layer]
questionGraph / recommendationGraph
        |
        v
[Domain Layer]
question engine / tag normalization / scoring / reranking / feedback
        |
        v
[Data Layer]
songs.json / users.json / localStorage / Gemini API
```

### 설계 원칙

- UI는 입력과 출력에 집중하고, 판단 로직은 그래프와 도메인 함수로 분리한다.
- LangGraph는 "상태 전이"를 담당하고, 실제 계산은 순수 함수에 위임한다.
- LLM은 추천 생성기가 아니라 설명 생성기 역할에 한정한다.
- 모든 추천 점수는 디버깅 가능하도록 중간 결과를 남긴다.

## 4. 사용자 시나리오

### 시나리오 A: 정상 질문 완료 후 추천

1. 사용자가 시작 페이지 진입
2. "추천 시작" 클릭
3. 5~7개 질문에 답변
4. 질문 완료 후 추천 그래프 실행
5. 추천 결과 3~5곡과 이유 표시
6. 사용자가 좋아요/싫어요/다시 추천 선택

### 시나리오 B: 일부 질문 스킵 후 추천

1. 사용자가 일부 질문에서 스킵 선택
2. 최소 정보 충족 시 추천 그래프 실행
3. 부족한 정보는 기본값 또는 약한 가중치로 처리

### 시나리오 C: 자유 텍스트 입력 포함

1. 사용자가 "지금 기분" 같은 항목에 자유 텍스트 입력
2. Gemini 또는 규칙 기반 태그 정규화 실행
3. 정규화된 태그를 추천 입력으로 병합

## 5. 화면 설계

## 5.1 페이지 구조

| 페이지 | 목적 | 핵심 요소 |
|---|---|---|
| `HomePage` | 시작 진입 | 프로젝트 소개, 시작 버튼, 최근 세션 복원 |
| `QuestionPage` | 질문 진행 | 진행 바, 질문 카드, 답변 버튼, 스킵 버튼 |
| `LoadingPage` 또는 섹션 | 추천 중 상태 표시 | 현재 단계 표시, 스피너, 처리 상태 메시지 |
| `ResultPage` | 추천 결과 표시 | 추천 카드, 추천 이유, 점수 근거, 피드백 버튼 |

### 5.2 공통 UI 컴포넌트

| 컴포넌트 | 역할 |
|---|---|
| `QuestionCard` | 질문 텍스트와 설명 표시 |
| `AnswerOptionList` | 객관식 답변 목록 렌더링 |
| `AnswerChip` | 선택형 답변 버튼 |
| `ProgressBar` | 질문 진행률 표시 |
| `LoadingStepView` | 추천 처리 단계 표시 |
| `RecommendationCard` | 곡 정보와 추천 이유 표시 |
| `ScoreBreakdown` | 콘텐츠/협업/상황 점수 표시 |
| `FeedbackBar` | 좋아요/싫어요/재추천 액션 제공 |

### 5.3 페이지 전이 규칙

```text
HomePage
 -> QuestionPage
 -> Loading
 -> ResultPage
 -> QuestionPage(재추천)
```

## 6. 질문 플로우 설계

### 6.1 질문 데이터 모델

```ts
export type QuestionType = "single" | "multi" | "boolean" | "text";

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
  tags?: string[];
}

export interface Question {
  id: string;
  title: string;
  description?: string;
  type: QuestionType;
  options?: QuestionOption[];
  required: boolean;
  skippable: boolean;
  mapsTo:
    | "mood"
    | "activity"
    | "genre"
    | "tempo"
    | "time"
    | "lyrics"
    | "energy";
}
```

### 6.2 추천 질문 세트

| 순서 | 질문 ID | 목적 |
|---|---|---|
| 1 | `mood` | 현재 감정/분위기 수집 |
| 2 | `activity` | 사용 상황 수집 |
| 3 | `genre` | 선호 장르 수집 |
| 4 | `tempo` | 빠르기 선호 수집 |
| 5 | `time` | 시간대 맥락 수집 |
| 6 | `lyrics` | 가사 유무 선호 수집 |
| 7 | `freeTextMood` | 자유 텍스트 보강 수집 |

### 6.3 질문 종료 조건

아래 중 하나를 만족하면 질문 그래프를 종료한다.

- 필수 질문이 모두 완료됨
- 총 응답 수가 최소 기준 이상이고 사용자가 종료 선택
- 스킵 포함 응답 수가 최대 질문 수에 도달

## 7. LangGraph 설계

### 7.1 Graph 분리 전략

- `questionGraph`: 세션 시작부터 질문 종료 판단까지 담당
- `recommendationGraph`: 후보 탐색부터 결과 포맷팅까지 담당

이 둘을 분리하면 발표 설명이 쉬워지고, 추천 로직만 독립 테스트하기도 쉽다.

### 7.2 공통 그래프 상태

```ts
export type SessionStatus =
  | "idle"
  | "questioning"
  | "tagging"
  | "recommending"
  | "done"
  | "error";

export interface AnswerRecord {
  questionId: string;
  value: string | string[] | boolean;
  skipped?: boolean;
}

export interface RecommendationItem {
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

export interface AppGraphState {
  sessionId: string;
  sessionStatus: SessionStatus;
  currentQuestionIndex: number;
  answers: AnswerRecord[];
  preferenceTags: string[];
  normalizedProfile: NormalizedUserProfile | null;
  candidateSongs: ScoredSong[];
  finalRecommendations: RecommendationItem[];
  isSkipped: boolean;
  errorMessage?: string;
}
```

### 7.3 질문 그래프 노드 계약

| 노드 | 입력 | 출력 |
|---|---|---|
| `startSession` | 없음 | 초기 state 생성 |
| `loadQuestion` | 현재 index | 현재 질문 반환 |
| `saveAnswer` | 사용자 응답 | `answers` 갱신 |
| `checkCompletion` | `answers`, `index` | 종료 여부 판단 |
| `routeNextQuestion` | 종료 여부 | 다음 질문 index 결정 |
| `finalizePreferenceTags` | `answers` | `preferenceTags` 생성 |

### 7.4 추천 그래프 노드 계약

| 노드 | 입력 | 출력 |
|---|---|---|
| `normalizeUserProfile` | `answers`, `preferenceTags` | 표준화 프로필 |
| `contentBasedRetrieve` | 프로필, `songs.json` | 콘텐츠 점수 후보 |
| `collaborativeBoost` | 프로필, `users.json` | 협업 점수 보정 후보 |
| `contextRerank` | 후보, 시간/활동/감정 | 상황 점수 반영 |
| `mergeScores` | 각 점수 목록 | 최종 정렬 결과 |
| `llmReasoning` | 상위 N개 후보 | 자연어 추천 이유 |
| `formatResult` | 후보 + 이유 | UI 출력 모델 |

### 7.5 그래프 흐름

```text
questionGraph
startSession
 -> loadQuestion
 -> saveAnswer
 -> checkCompletion
 -> routeNextQuestion
 -> finalizePreferenceTags

recommendationGraph
normalizeUserProfile
 -> contentBasedRetrieve
 -> collaborativeBoost
 -> contextRerank
 -> mergeScores
 -> llmReasoning
 -> formatResult
```

## 8. 도메인 모델 설계

### 8.1 Song 모델

```ts
export interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
  bpm: number;
  moodTags: string[];
  activityTags: string[];
  hasLyrics: boolean;
  energyLevel: number;
}
```

### 8.2 User 모델

```ts
export interface MockUserProfile {
  id: string;
  preferredGenres: string[];
  preferredMoods: string[];
  preferredTime: "morning" | "afternoon" | "evening" | "night";
  likedSongs: string[];
  skippedSongs: string[];
}
```

### 8.3 정규화된 사용자 프로필

```ts
export interface NormalizedUserProfile {
  moods: string[];
  activities: string[];
  genres: string[];
  preferredBpmRange?: [number, number];
  preferredTime?: "morning" | "afternoon" | "evening" | "night";
  prefersLyrics?: boolean;
  energyLevel?: number;
}
```

### 8.4 스코어링 결과 모델

```ts
export interface ScoredSong {
  song: Song;
  contentScore: number;
  collaborativeScore: number;
  contextScore: number;
  finalScore: number;
  matchedTags: string[];
}
```

## 9. 추천 로직 설계

### 9.1 콘텐츠 기반 점수

기본 계산식은 가중합으로 처리한다.

| 항목 | 조건 | 점수 |
|---|---|---|
| 장르 | 정확 일치 | +3 |
| 분위기 | 태그 일치 1개당 | +2 |
| 활동 | 태그 일치 1개당 | +2 |
| BPM | 선호 범위 내 | +2 |
| 가사 | 선호 일치 | +1 |
| 에너지 | 선호 차이 작음 | +1 |

### 9.2 협업 필터링 점수

간단한 목업 단계에서는 아래 방식으로 구현한다.

1. 현재 프로필과 각 가상 사용자 사이 유사도 계산
2. 상위 유사 사용자 3명을 선택
3. 그들이 좋아한 곡에 가산점 부여
4. 그들이 자주 스킵한 곡은 감점

예시 수식:

```ts
collaborativeScore = similaritySumOfUsersWhoLikedSong - similaritySumOfUsersWhoSkippedSong;
```

### 9.3 상황 기반 점수

상황 점수는 규칙 기반으로 처리한다.

| 조건 | 규칙 |
|---|---|
| `preferredTime === night` | `calm`, `emotional`, 저BPM 가산 |
| `activity === study` | `hasLyrics === false` 가산 |
| `activity === workout` | 고BPM, 고에너지 가산 |
| `mood === tired` | 잔잔한 곡, 중저에너지 가산 |

### 9.4 최종 점수

```ts
finalScore =
  0.5 * contentScore +
  0.3 * collaborativeScore +
  0.2 * contextScore;
```

초기 버전에서는 이 값을 사용하고, 실험 후 조정한다.

## 10. 태그 정규화 설계

### 10.1 정규화 목적

- 질문 답변 표현을 내부 추천 태그로 통일
- 자유 텍스트 입력을 구조화
- 추천 함수가 일관된 키를 사용하도록 보장

### 10.2 정규화 방식

1. 객관식 응답은 미리 정의된 태그 매핑 사용
2. 자유 텍스트는 1차 규칙 기반 사전 매핑
3. 필요 시 Gemini로 보강 태깅

### 10.3 예시 매핑

| 사용자 표현 | 내부 태그 |
|---|---|
| 차분한 | `calm` |
| 신나는 | `energetic` |
| 공부 | `study` |
| 운동 | `workout` |
| 밤 | `night` |
| 가사 없는 | `instrumental` |

## 11. Gemini 연동 설계

### 11.1 사용 범위

- 자유 텍스트 응답 태그 추출
- 최종 추천 이유 생성

### 11.2 비사용 범위

- 전체 추천 순위 결정
- 모든 곡 후보의 대량 평가

### 11.3 입력/출력 계약

```ts
export interface ReasoningInput {
  userProfile: NormalizedUserProfile;
  songs: Array<{
    title: string;
    artist: string;
    matchedTags: string[];
    finalScore: number;
  }>;
}
```

Gemini 출력은 아래 JSON 형태를 기대한다.

```json
{
  "recommendations": [
    {
      "title": "Midnight Lo-fi",
      "reason": "밤 시간대와 차분한 분위기에 잘 맞는 곡입니다."
    }
  ]
}
```

### 11.4 실패 대응

- Gemini 호출 실패 시 기본 템플릿 문장 사용
- 추천 자체는 LLM 실패와 무관하게 계속 진행

## 12. 상태 관리 설계

추천 상태 관리는 `Zustand`를 권장한다.

이유는 아래와 같다.

- 질문 진행 상태와 결과 상태를 단순하게 보관 가능
- 컴포넌트 간 전달이 명확함
- 로컬 스토리지 연동이 쉽다

### 12.1 Store 예시

```ts
export interface AppStore {
  state: AppGraphState;
  startSession: () => void;
  answerQuestion: (payload: AnswerRecord) => void;
  skipQuestion: (questionId: string) => void;
  runRecommendation: () => Promise<void>;
  submitFeedback: (songId: string, value: "like" | "dislike") => void;
  resetSession: () => void;
}
```

## 13. 파일 구조 제안

```text
src/
├─ app/
│  ├─ App.tsx
│  ├─ router.tsx
│  └─ providers.tsx
├─ pages/
│  ├─ HomePage.tsx
│  ├─ QuestionPage.tsx
│  └─ ResultPage.tsx
├─ components/
│  ├─ question/
│  ├─ result/
│  └─ common/
├─ data/
│  ├─ songs.json
│  ├─ users.json
│  └─ questions.ts
├─ graph/
│  ├─ questionGraph.ts
│  ├─ recommendationGraph.ts
│  └─ nodes/
├─ domain/
│  ├─ scoring/
│  ├─ normalization/
│  ├─ recommendation/
│  └─ feedback/
├─ services/
│  ├─ gemini.ts
│  ├─ storage.ts
│  └─ logger.ts
├─ store/
│  └─ useAppStore.ts
├─ types/
│  ├─ question.ts
│  ├─ song.ts
│  ├─ user.ts
│  └─ graph.ts
└─ utils/
   ├─ constants.ts
   └─ format.ts
```

## 14. 로컬 스토리지 설계

### 저장 항목

- 마지막 세션 답변
- 최종 추천 결과
- 피드백 기록

### 키 규칙

```text
ai-recsys/session
ai-recsys/results
ai-recsys/feedback
```

### 정책

- 세션은 브라우저 새로고침 복구용
- 추천 결과는 마지막 1회분만 보관
- 피드백은 배열 형태로 누적

## 15. 예외 처리 설계

| 상황 | 처리 방식 |
|---|---|
| 질문 데이터 누락 | 에러 상태 전이 후 기본 안내 표시 |
| `songs.json` 비어 있음 | 추천 불가 메시지 표시 |
| Gemini API 실패 | 기본 이유 문장으로 대체 |
| 태그 정규화 실패 | 원본 답변 기반 최소 추천 수행 |
| 추천 결과 0건 | 조건 완화 후 재탐색 |

### 추천 결과 0건일 때 완화 순서

1. 장르 제약 완화
2. BPM 제약 완화
3. 활동 태그 제약 완화
4. 인기 기반 또는 랜덤 fallback

## 16. 테스트 설계

### 단위 테스트 대상

- 태그 정규화 함수
- 콘텐츠 기반 점수 계산
- 협업 필터링 유사도 계산
- 상황 기반 재정렬 규칙

### 통합 테스트 대상

- 질문 완료 후 추천 결과 생성 플로우
- 스킵 포함 질문 플로우
- Gemini 실패 시 fallback 문구 처리

### 수동 테스트 체크리스트

- 질문 선택 즉시 UI가 반응하는가
- 진행 바가 정확히 갱신되는가
- 추천 결과가 3개 이상 안정적으로 나오는가
- 좋아요/싫어요 입력이 저장되는가
- 새로고침 후 세션 복원이 가능한가

## 17. 구현 우선순위

### Phase 1: 기본 UI + 질문 플로우

- 페이지 라우팅 구성
- 질문 데이터 정의
- 질문 카드 UI 구현
- 질문 그래프 연결

### Phase 2: 추천 엔진 MVP

- `songs.json`, `users.json` 작성
- 콘텐츠 기반 점수 계산 구현
- 협업 필터링 보정 구현
- 상황 기반 재정렬 구현

### Phase 3: 결과 표현 고도화

- 추천 카드 UI 구현
- 점수 breakdown 표시
- 로컬 스토리지 저장
- 피드백 입력 기능

### Phase 4: Gemini 연동

- 추천 이유 생성 연동
- 자유 텍스트 태깅 보강
- fallback 메시지 정비

## 18. 협업 작업 분리 기준

| 담당 영역 | 파일 기준 |
|---|---|
| UI | `pages/`, `components/` |
| 그래프 | `graph/` |
| 추천 로직 | `domain/scoring/`, `domain/recommendation/` |
| 데이터 | `data/` |
| LLM 연동 | `services/gemini.ts` |
| 상태 관리 | `store/useAppStore.ts` |

## 19. MVP 완료 기준

아래 조건을 만족하면 MVP로 본다.

- 질문 5개 이상이 정상 진행된다.
- 응답 완료 후 추천 결과가 최소 3곡 표시된다.
- 각 추천 곡에 추천 이유가 표시된다.
- 좋아요/싫어요 피드백이 저장된다.
- 새로고침 후 세션 복원이 가능하다.

## 20. 확장 방향

향후에는 아래 방향으로 확장한다.

- 백엔드 또는 서버리스 함수 도입
- 실제 사용자 로그 기반 협업 필터링 전환
- 음악 API 연동
- 감정 분석 고도화
- 날씨, 위치, 요일 등 컨텍스트 추가
- 사용자별 장기 선호 프로필 저장

## 21. 바로 구현할 첫 작업

개발 시작 시 가장 먼저 만들 파일은 아래 순서를 권장한다.

1. `src/types/` 타입 정의
2. `src/data/questions.ts`
3. `src/data/songs.json`, `src/data/users.json`
4. `src/domain/scoring/` 순수 함수
5. `src/graph/questionGraph.ts`
6. `src/graph/recommendationGraph.ts`
7. `src/store/useAppStore.ts`
8. `src/pages/QuestionPage.tsx`
9. `src/pages/ResultPage.tsx`

이 순서로 진행하면 UI와 추천 로직을 동시에 검증하기 쉽다.
