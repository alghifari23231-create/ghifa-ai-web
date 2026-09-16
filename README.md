# AQU.AI V2

AQU.AI is an AI Video Prompt & Visual Scene Production Studio built around one rule: uploaded reference images are the visual ground truth.

## Current application

The Next.js application is runnable and production-buildable. The current implemented studio is **Affiliate Pro** with:

- Character, Product, and Background reference uploads
- Server-side Gemini Vision analysis and Reference DNA
- Ground Truth Lock workflow
- Affiliate story/content-intent settings
- Scene planning with selectable scene count, duration, aspect ratio, dialog, camera, lighting, FPS, resolution, focus, and stabilization
- Real Gemini image generation for complete storyboard scene renders
- Real Gemini final-prompt compilation
- Save/copy/regenerate scene output
- Explicit API errors instead of fake generation states
- Server-only Gemini credentials
- `/api/health` runtime health check

The other four dashboard modules remain part of the directory and are not yet equivalent to Affiliate Pro in backend generation depth.

## Environment

Create `.env.local` in the project root for local development:

```env
GEMINI_API_KEY=your_server_side_key
GEMINI_VISION_MODEL=gemini-3.6-flash
GEMINI_SCENE_MODEL=gemini-3.6-flash
GEMINI_PROMPT_MODEL=gemini-3.6-flash
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image
```

**Never** use `NEXT_PUBLIC_GEMINI_API_KEY`. The Gemini key must remain server-side.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Production verification:

```bash
npm run build
npm run start
```

Health check:

```text
http://localhost:3000/api/health
```

The health response exposes only whether the Gemini key is configured (`true`/`false`), never the key itself.

## Deploy

AQU.AI is a standard Next.js App Router application and can be deployed to Vercel with the repository's default Next.js build settings.

After importing the repository into Vercel, add the same `GEMINI_*` variables in **Project Settings → Environment Variables** and redeploy. Vercel supplies environment variables to the server runtime; secrets must not be prefixed with `NEXT_PUBLIC_`.

## Validation

GitHub Actions runs:

1. dependency security audit
2. TypeScript check
3. Next.js production build

The workflow runs on both `main` and `aquai-v2-foundation` and on pull requests.

## Architecture

```text
AQU.AI
├── Dashboard / Module Directory
├── Studio Engine
│   ├── Affiliate Pro
│   ├── Podcast
│   ├── Vlog
│   ├── Cinematic Cinema
│   └── Cartoon Animasi
├── Reference Intelligence
│   ├── Character Vision
│   ├── Product Vision
│   ├── Background Vision
│   └── Reference DNA / Identity Lock
├── Story Engine
├── Image Generation Engine
├── Prompt Compiler
└── Project System
```

## Build roadmap

1. Foundation — complete
2. Reference Intelligence — complete for Affiliate Pro
3. Affiliate Pro studio — implemented
4. Scene Engine — implemented for Affiliate Pro
5. Storyboard Renderer — implemented with real generated scene images
6. GEMS Prompt Compiler — implemented for Affiliate Pro
7. Scene Regeneration — implemented
8. Additional modules — next development stage
