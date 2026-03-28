# AI-RecSys-Lab

AI-assisted hybrid music recommendation web app built with Next.js, realtime music APIs, and Gemini.

This project collects a user's current taste through short questions plus one free-text prompt, fetches candidate tracks from external music sources, reranks them with hybrid recommendation logic, and generates natural-language recommendation reasons.

## Overview

사용자 질문과 자유 서술을 바탕으로, 지금 상황에 맞는 음악을 찾는 추천 시스템입니다.

The app is designed around one simple question:

`What music fits the user's current mood, context, and taste right now?`

To answer that, the system combines:

- structured user input from guided questions
- realtime catalog lookup
- content-based scoring
- collaborative-style score boosts from local preference data
- context-aware reranking
- LLM-based free-text interpretation and explanation generation

## Features

질문 입력, 실시간 곡 조회, 하이브리드 추천, LLM 해석과 추천 이유 생성을 포함합니다.

- Guided questionnaire for music preference input
- Free-text final question interpreted by Gemini
- Realtime track lookup through iTunes Search API
- Tag enrichment through Last.fm top tags
- Hybrid recommendation pipeline
- Recommendation reasons generated with Gemini or fallback rules
- Result cards with feedback actions

## Recommendation Signals

추천은 장르, 무드, 활동, 템포, 에너지 다섯 축을 중심으로 동작합니다.

The current recommendation flow is centered on these signals:

- genre: `pop`, `r&b`, `soul`, `acoustic`, `lo-fi`, `ballad`, `indie`
- mood: `calm`, `energetic`, `emotional`, `comforting`, `romantic`
- activity: `study`, `workout`, `relax`, `commute`
- tempo: `slow`, `mid`, `fast`
- energy: `low`, `medium`, `high`

The last question is free-form text, and the LLM maps that input back into these same signals to enrich the profile.

## How It Works

입력 수집부터 추천 이유 생성까지 하나의 파이프라인으로 연결됩니다.

```text
Question answers
-> Answer normalization
-> Free-text LLM augmentation
-> Realtime catalog fetch
-> Tag enrichment
-> Content-based scoring
-> Collaborative boost
-> Context rerank
-> Final score merge
-> Recommendation reason generation
-> Result rendering
```

## Tech Stack

Next.js 기반 프론트엔드에 Zustand, Gemini, 외부 음악 API를 결합한 구조입니다.

- Next.js 16
- React 19
- TypeScript
- Zustand
- Tailwind CSS
- Radix UI
- Gemini API
- iTunes Search API
- Last.fm API

## Project Structure

UI, 추천 로직, 외부 API 연동, 상태 관리가 역할별로 분리되어 있습니다.

```text
src/
├─ app/              # App router entry and API routes
├─ components/       # UI components
├─ data/             # Local question and mock preference data
├─ domain/           # Normalization, scoring, recommendation logic
├─ graph/            # Recommendation workflow functions
├─ pages/            # Screen-level views
├─ services/         # External API and LLM integrations
├─ store/            # Zustand app state
├─ types/            # Shared TypeScript types
└─ utils/            # View and formatting helpers
```

## Getting Started

아래 순서대로 의존성 설치, 환경변수 설정, 개발 서버 실행을 하면 됩니다.

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env.local` and set the values you need.

```env
LASTFM_API_KEY=your_lastfm_api_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_GEMINI_MODEL=your_preferred_gemini_model
```

Notes:

- `LASTFM_API_KEY` is used for track tag enrichment.
- `NEXT_PUBLIC_GEMINI_API_KEY` is used for free-text interpretation and reason generation.
- If Gemini is not configured, the app falls back to heuristic profile enrichment and template-style reasons.

### 3. Run the development server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Available Scripts

개발, 빌드, 실행, 타입체크에 필요한 기본 스크립트입니다.

```bash
npm run dev
npm run build
npm run start
npm run typecheck
```

## Current Limitations

실시간 태그 품질과 로컬 목업 기반 보정 로직 때문에 아직 개선 여지가 있습니다.

- Last.fm tags are inconsistent across tracks, and some results come back with empty tags.
- Collaborative scoring is still based on local mock preference data.
- Some recommendation signals are inferred heuristically rather than sourced from structured audio features.

## Future Improvements

실제 사용자 피드백과 더 풍부한 음악 메타데이터를 붙이는 방향으로 확장할 수 있습니다.

- Persist real user feedback and use it for ranking updates
- Add evaluation dashboards for click-through and satisfaction signals
- Improve genre and mood normalization dictionaries
- Integrate richer structured music metadata

## License

현재는 별도 라이선스를 추가하지 않은 상태입니다.

No license has been added yet.
