# DEV README

## Akinator-Style AI Music Recommender

> React + LangGraph + Gemini 기반 서버리스 프론트엔드 프로토타입

## 1. 프로젝트 소개

이 프로젝트는 아키네이터형 질문 인터페이스를 통해 사용자의 현재 취향과 상황을 수집하고, 이를 바탕으로 음악을 추천하는 AI 음악 추천 시스템 프로토타입입니다.

서버 없이 프론트엔드만으로 구현하며, React 환경에서 `@langchain/langgraph`를 사용해 질문 흐름 제어와 추천 워크플로우 오케스트레이션을 수행합니다. 최종적으로 Gemini API를 호출하여 추천 이유를 생성하고, 결과를 사용자에게 보여줍니다.

### 핵심 포인트

- 질문형 UI를 통한 사용자 상태 수집
- LangGraph 기반 상태 관리 및 워크플로우 구성
- 콘텐츠 기반 추천 + 협업 필터링 + 상황 기반 재정렬
- Gemini를 활용한 추천 이유 생성
- 서버 없는 프론트엔드 프로토타입 구조

## 2. 프로젝트 목표

이 프로젝트의 목표는 단순히 음악을 추천하는 것이 아니라, 아래 흐름 전체를 하나의 시스템으로 설계하고 구현하는 것입니다.

- 사용자의 현재 감정, 상황, 취향을 질문으로 수집
- 답변을 기반으로 추천 후보를 탐색
- 가상 사용자 데이터로 개인화 보정
- 현재 상황에 맞게 최종 순위 재정렬
- LLM을 통해 추천 이유를 자연어로 생성
- 추천 결과에 대한 사용자 피드백 수집

## 3. 기술 스택

| 영역 | 기술 |
|---|---|
| Frontend | React, Vite, TypeScript |
| Workflow / AI Orchestration | `@langchain/langgraph`, `@langchain/core` |
| LLM | Gemini API |
| Data | Local JSON (`songs.json`, `users.json`) |
| State | Local state, `localStorage` |
| Styling | CSS / Tailwind / Styled Components 중 팀 선택 |

## 4. 전체 아키텍처

이 프로젝트는 서버 없이 브라우저 내부에서 아래 흐름으로 동작합니다.

```text
사용자 답변 클릭
-> React 상태 업데이트
-> LangGraph state 갱신
-> 질문 흐름 분기
-> 최종 추천 그래프 실행
-> Gemini 호출
-> 결과 렌더링
```

즉, LangGraph는 단순 API 호출 도구가 아니라 질문 수집부터 추천 결과 생성까지의 흐름을 제어하는 상태 기반 워크플로우 엔진으로 사용됩니다.

## 5. 핵심 설계 개념

### 5.1 왜 LangGraph를 사용하는가

일반적인 프론트엔드 앱이라면 `if/else`나 상태 분기로 질문 흐름을 처리할 수도 있습니다. 하지만 본 프로젝트는 아래와 같은 흐름을 명확히 구조화할 필요가 있습니다.

- 질문 답변 저장
- 질문 완료 여부 판단
- 다음 질문 분기
- 사용자 선호 태그 정리
- 추천 후보 탐색
- 협업 필터링 보정
- 상황 기반 재정렬
- LLM 호출
- 최종 결과 포맷팅

LangGraph를 사용하면 이 흐름을 노드 기반 워크플로우로 설계할 수 있어 발표 시 설명력이 좋고 유지보수도 쉬워집니다.

## 6. 시스템 구성

본 시스템은 크게 두 개의 그래프로 나뉩니다.

### 6.1 질문 진행 그래프

사용자와 인터랙션하며 답변을 수집하는 그래프입니다.

**역할**

- 답변 저장
- 현재 질문 `index` 관리
- 질문 완료 여부 판단
- 다음 질문 결정
- 중간 선호 태그 정리

### 6.2 최종 추천 그래프

질문이 끝나거나 사용자가 스킵을 선택했을 때 실행되는 그래프입니다.

**역할**

- 사용자 프로필 정규화
- 콘텐츠 기반 추천
- 협업 필터링 보정
- 상황 기반 재정렬
- Gemini 호출
- 추천 결과 구조화

## 7. LangGraph 노드 설계

### 7.1 질문 진행용 그래프 노드

| 노드 | 설명 |
|---|---|
| `startSession` | 사용자 세션 초기화, 초기 state 생성, 첫 질문으로 이동 |
| `saveAnswer` | 사용자가 선택한 답변 저장, 분위기/장르/상황/시간대 등 반영 |
| `checkCompletion` | 질문이 충분히 수집되었는지 확인, 스킵 여부도 함께 판단 |
| `routeNextQuestion` | 다음 질문 결정, 아직 수집되지 않은 정보 우선 질문 |
| `finalizePreferenceTags` | 답변들을 기반으로 선호 태그 정리 (`calm`, `night`, `study`, `lofi`, `slow_bpm`) |

### 7.2 추천 실행용 그래프 노드

| 노드 | 설명 |
|---|---|
| `normalizeUserProfile` | 응답 데이터를 추천 계산용 프로필로 정리하고 장르/템포/분위기/활동/시간대를 표준화 |
| `contentBasedRetrieve` | `songs.json`에서 조건이 맞는 곡 후보를 탐색하고 장르/분위기/BPM/활동 태그 기반 점수 계산 |
| `collaborativeBoost` | `users.json`의 가상 사용자 데이터를 이용해 비슷한 취향 그룹이 좋아한 곡에 가중치 부여 |
| `contextRerank` | 현재 상황에 맞게 후보곡 재정렬, 시간대/감정/활동 등에 따라 점수 조정 |
| `mergeScores` | 콘텐츠 점수 + 협업 점수 + 상황 점수를 합산하여 최종 Top-N 선정 |
| `llmReasoning` | Gemini API 호출, 추천 이유 생성, 필요 시 상위 후보에 대한 미세 해석 보조 |
| `formatResult` | 화면 출력용 데이터 구조로 변환, 곡명/아티스트/점수/추천 이유 포함 |

## 8. 추천 알고리즘 설계

본 프로젝트는 하이브리드 추천 방식을 사용합니다.

### 8.1 콘텐츠 기반 추천

사용자의 답변과 곡의 속성을 비교하여 유사한 곡을 찾습니다.

**비교 항목 예시**

- 장르
- 분위기
- BPM
- 활동 태그
- 가사 유무
- 에너지 수준

**예시 점수**

- 장르 일치: `+3`
- 분위기 일치: `+3`
- BPM 유사: `+2`
- 활동 태그 일치: `+2`

### 8.2 협업 필터링

가상의 사용자 데이터에서 현재 사용자와 비슷한 취향을 가진 그룹을 찾아, 그들이 좋아한 곡에 추가 점수를 부여합니다.

**목적**

단순 특성 유사 곡 추천을 넘어, "비슷한 취향의 사람들이 좋아한 곡"을 반영하기 위함입니다.

**구현 방식**

- 간단한 User-Item Matrix 사용
- 코사인 유사도 또는 단순 유사도 점수 활용

### 8.3 상황 기반 재정렬

현재 감정, 시간대, 활동 상황에 따라 최종 추천 순위를 조정합니다.

**예시 규칙**

- 밤이면 잔잔한 곡 가점
- 공부 중이면 가사 강한 곡 감점
- 운동 중이면 빠른 BPM 곡 가점
- 우울한 상태면 차분하고 위로되는 분위기 가점

### 8.4 최종 점수 예시

최종 추천 점수는 아래와 같이 계산할 수 있습니다.

- 콘텐츠 기반 점수: `0.5`
- 협업 필터링 점수: `0.3`
- 상황 기반 점수: `0.2`

```ts
finalScore = 0.5 * contentScore + 0.3 * collaborativeScore + 0.2 * contextScore;
```

가중치는 실험 중 조정 가능합니다.

## 9. LLM(Gemini)의 역할

본 프로젝트에서 Gemini는 추천 엔진 전체를 대체하지 않습니다. LLM은 아래와 같은 보조 역할을 수행합니다.

### 9.1 답변 해석

사용자의 자유 텍스트 답변을 구조화된 태그로 변환합니다.

**예시**

```text
입력: 오늘 좀 지치고 조용한 곡 듣고 싶어요
결과 태그: calm, tired, night, slow_bpm
```

### 9.2 추천 이유 생성

최종 추천된 곡에 대해 자연어 설명을 생성합니다.

**예시**

> 이 곡은 밤 시간대와 차분한 분위기에 잘 맞고, 사용자가 선호한 Lo-fi 계열과 유사한 특성을 가지고 있습니다.

### 9.3 보조적 재정렬

필요할 경우 상위 후보 몇 곡에 대해서만 맥락적 보정을 수행합니다.

## 10. 상태(State) 설계

LangGraph와 React에서 공통으로 다룰 주요 state는 다음과 같습니다.

| 상태 키 | 설명 |
|---|---|
| `answers` | 사용자의 질문 응답 목록 |
| `currentQuestionIndex` | 현재 질문 순서 |
| `preferenceTags` | 추출된 취향/상황 태그 |
| `candidateSongs` | 1차 후보곡 리스트 |
| `contentScores` | 콘텐츠 기반 점수 |
| `collaborativeScores` | 협업 필터링 점수 |
| `contextScores` | 상황 기반 점수 |
| `finalRecommendations` | 최종 추천 결과 |
| `recommendationReasons` | 추천 이유 |
| `isSkipped` | 질문 스킵 여부 |
| `sessionStatus` | 진행 상태 (`idle`, `questioning`, `recommending`, `done`) |

## 11. 데이터 구조

### 11.1 `songs.json`

실험용 곡 메타데이터를 저장합니다.

**예시 필드**

- `id`
- `title`
- `artist`
- `genre`
- `bpm`
- `moodTags`
- `activityTags`
- `hasLyrics`
- `energyLevel`

**예시**

```json
{
  "id": "song_001",
  "title": "Midnight Lo-fi",
  "artist": "Sample Artist",
  "genre": "Lo-fi",
  "bpm": 72,
  "moodTags": ["calm", "night", "emotional"],
  "activityTags": ["study", "relax"],
  "hasLyrics": false,
  "energyLevel": 2
}
```

### 11.2 `users.json`

가상의 사용자 취향 데이터입니다.

**예시 필드**

- `id`
- `preferredGenres`
- `preferredMoods`
- `preferredTime`
- `likedSongs`
- `skippedSongs`

**예시**

```json
{
  "id": "user_001",
  "preferredGenres": ["Lo-fi", "Ballad"],
  "preferredMoods": ["calm", "night"],
  "preferredTime": "night",
  "likedSongs": ["song_001", "song_014", "song_032"],
  "skippedSongs": ["song_007"]
}
```

## 12. 질문 설계

질문 수는 너무 많으면 피로도가 높아지므로 `5~7개` 내외를 권장합니다.

### 질문 예시

- 지금 듣고 싶은 분위기는 무엇인가요?
- 현재 어떤 상황인가요?
- 선호하는 장르는 무엇인가요?
- 빠른 템포가 좋나요?
- 지금 시간대는 언제인가요?
- 가사가 있는 곡이 좋나요?

### UX 설계 포인트

- 객관식 위주로 설계
- 일부 질문은 스킵 가능
- 답변 즉시 시각적 피드백 제공
- 마지막에 추천 이유 함께 제시

## 13. 폴더 구조 예시

```text
src/
├─ assets/
├─ components/
│  ├─ QuestionCard.tsx
│  ├─ AnswerButton.tsx
│  ├─ LoadingView.tsx
│  ├─ RecommendationCard.tsx
│  └─ ResultList.tsx
├─ data/
│  ├─ songs.json
│  └─ users.json
├─ graph/
│  ├─ questionGraph.ts
│  ├─ recommendationGraph.ts
│  ├─ nodes/
│  │  ├─ startSession.ts
│  │  ├─ saveAnswer.ts
│  │  ├─ checkCompletion.ts
│  │  ├─ routeNextQuestion.ts
│  │  ├─ finalizePreferenceTags.ts
│  │  ├─ normalizeUserProfile.ts
│  │  ├─ contentBasedRetrieve.ts
│  │  ├─ collaborativeBoost.ts
│  │  ├─ contextRerank.ts
│  │  ├─ mergeScores.ts
│  │  ├─ llmReasoning.ts
│  │  └─ formatResult.ts
├─ hooks/
│  ├─ useQuestionFlow.ts
│  └─ useRecommendationFlow.ts
├─ lib/
│  ├─ gemini.ts
│  ├─ scoring.ts
│  ├─ similarity.ts
│  └─ tagNormalizer.ts
├─ pages/
│  ├─ Home.tsx
│  ├─ QuestionPage.tsx
│  └─ ResultPage.tsx
├─ store/
│  └─ useAppStore.ts
├─ types/
│  ├─ song.ts
│  ├─ user.ts
│  └─ graphState.ts
├─ App.tsx
└─ main.tsx
```

## 14. 실행 방법

### 14.1 설치

```bash
npm install
```

### 14.2 주요 패키지 설치 예시

```bash
npm install @langchain/langgraph @langchain/core
```

Gemini 연동용 패키지는 팀에서 사용하는 방식에 맞춰 추가합니다.

### 14.3 실행

```bash
npm run dev
```

## 15. 환경 변수

LLM API 키는 일반적으로 `.env`에 저장합니다.

**예시**

```env
VITE_GEMINI_API_KEY=your_api_key
```

프론트엔드 환경에서는 `VITE_` prefix를 사용합니다.

## 16. 보안 주의사항

이 프로젝트는 서버 없는 프론트엔드 프로토타입이므로 Gemini API 키가 브라우저 번들에 포함될 수 있습니다.

즉, 이 구조는 발표용/실험용 프로토타입에는 적합하지만 실서비스에는 적합하지 않습니다.

### 실제 서비스 전환 시 권장 구조

- 서버 또는 서버리스 함수 사용
- API 키를 백엔드에서 보호
- 프론트엔드는 백엔드 API만 호출

### 발표 시 설명 예시

> 본 프로젝트는 프로토타입 구현을 목표로 하므로 프론트엔드에서 직접 API를 호출하는 구조를 사용하였다. 실제 서비스에서는 서버 또는 서버리스 함수를 두어 API 키를 보호하는 구조가 필요하다.

## 17. 평가 지표

### 정량 평가

- 추천 결과 좋아요 클릭률
- 싫어요 클릭률
- 스킵 버튼 사용률
- 재추천 요청 비율
- 질문 중간 이탈률

### 정성 평가

- 추천 결과가 현재 상황에 맞는가
- 추천 결과가 취향을 잘 반영하는가
- 질문 수가 부담스럽지 않은가
- 추천 이유가 납득 가능한가
- 전체 UX가 흥미로운가

## 18. 개발 우선순위

### 1차 목표

- 질문 UI 구현
- React 상태 흐름 연결
- LangGraph 질문 그래프 구성
- 로컬 JSON 로딩

### 2차 목표

- 콘텐츠 기반 추천 구현
- 협업 필터링 점수 반영
- 상황 기반 재정렬 구현

### 3차 목표

- Gemini 연동
- 추천 이유 생성
- 결과 화면 고도화

### 4차 목표

- 로컬 스토리지 저장
- 피드백 수집
- 평가 데이터 정리

## 19. 협업 분담 예시

### PM / 기획

- 질문 시나리오 설계
- 화면 흐름 정의
- 일정 관리
- 발표 자료 총괄

### 프론트엔드

- UI 구현
- 상태 관리
- 그래프 실행 연결
- 결과 화면 출력

### 데이터 / 추천 로직

- 곡/가상유저 JSON 작성
- 점수 계산 함수 구현
- 추천 알고리즘 조정

### AI / LangGraph

- 그래프 노드 설계
- LLM 프롬프트 작성
- 추천 이유 생성 로직 구현

### QA / 평가

- 사용자 테스트 진행
- 피드백 수집
- 결과 분석 및 정리

## 20. 한계

현재 구조는 다음과 같은 한계를 가집니다.

- 실제 사용자 로그가 아닌 목업 데이터 기반
- 프론트엔드 직접 API 호출로 인한 보안 취약성
- 협업 필터링이 가상 데이터에 의존
- 대규모 추천 시스템 성능 검증은 어려움

## 21. 향후 확장 방향

- 실제 음악 API 또는 실제 사용자 로그 연동
- 서버리스 함수 도입
- 감정 분석 고도화
- 날씨/위치 등 추가 컨텍스트 반영
- 추천 결과 저장 및 개인화 강화

## 22. 요약

이 프로젝트는 React 프론트엔드 내부에서 LangGraph를 활용해 질문 흐름과 추천 흐름을 상태 기반으로 관리하는 음악 추천 시스템 프로토타입입니다.

### 핵심 흐름

```text
질문형 UI
-> LangGraph 상태 관리
-> 콘텐츠 기반 추천
-> 협업 필터링
-> 상황 기반 재정렬
-> Gemini 설명 생성
-> 결과 출력
```

즉, 이 프로젝트에서 LangGraph는 단순 API 호출 라이브러리가 아니라 추천 시스템의 단계적 의사결정을 제어하는 워크플로우 오케스트레이션 계층으로 사용됩니다.

## 변경 이력

### 2026-03-24 실행 스택 정리

- 기존 본문은 유지하고, 현재 실행 기준만 하단에 추가한다.
- 현재 프론트엔드 실행 스택은 `Vite` 문서 설명과 달리 `Next.js App Router` 기반으로 동작한다.
- 다만 팀 분업 충돌을 줄이기 위해 실제 작업 위치는 여전히 `src/pages/`, `src/components/`, `src/store/`, `src/utils/`, `src/data/` 중심으로 유지한다.
- 실행 엔트리:
  - `src/app/layout.tsx`
  - `src/app/page.tsx`
- 주요 프론트 작업 파일:
  - `src/pages/HomePage.tsx`
  - `src/pages/QuestionPage.tsx`
  - `src/pages/LoadingPage.tsx`
  - `src/pages/ResultPage.tsx`
  - `src/store/useAppStore.ts`
  - `src/styles.css`
- 개발 서버 실행:

```bash
npm run dev
```

- 현재 `package.json`의 `dev` 스크립트는 `next dev`를 사용한다.
- 타입 확인은 아래 명령으로 진행한다.

```bash
npm run typecheck
```

- 데이터/추천/AI 로직 연동 시에는 `src/store/useAppStore.ts`의 `graphState`, `applyRecommendationItems`, `syncAnswersToGraph`, `getAnswerRecords`를 프론트-추천 연결 지점으로 활용하면 된다.
