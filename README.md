# AI-RecSys-Lab

AI-assisted hybrid music recommendation web app built with Next.js, realtime music APIs, and Gemini.

This project collects a user's current taste through short questions plus one free-text prompt, fetches candidate tracks from external music sources, reranks them with hybrid recommendation logic, and generates natural-language recommendation reasons.

## Overview

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

- Guided questionnaire for music preference input
- Free-text final question interpreted by Gemini
- Realtime track lookup through iTunes Search API
- Tag enrichment through Last.fm top tags
- Hybrid recommendation pipeline
- Recommendation reasons generated with Gemini or fallback rules
- Result cards with feedback actions

## Recommendation Signals

The current recommendation flow is centered on these signals:

- genre: `pop`, `r&b`, `soul`, `acoustic`, `lo-fi`, `ballad`, `indie`
- mood: `calm`, `energetic`, `emotional`, `comforting`, `romantic`
- activity: `study`, `workout`, `relax`, `commute`
- tempo: `slow`, `mid`, `fast`
- energy: `low`, `medium`, `high`

The last question is free-form text, and the LLM maps that input back into these same signals to enrich the profile.

## How It Works

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

```bash
npm run dev
npm run build
npm run start
npm run typecheck
```

## Current Limitations

- Last.fm tags are inconsistent across tracks, and some results come back with empty tags.
- Collaborative scoring is still based on local mock preference data.
- Some recommendation signals are inferred heuristically rather than sourced from structured audio features.

## Future Improvements

- Persist real user feedback and use it for ranking updates
- Add evaluation dashboards for click-through and satisfaction signals
- Improve genre and mood normalization dictionaries
- Integrate richer structured music metadata

## License

No license has been added yet.
