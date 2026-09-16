# AQU.AI V2 API Architecture

Branch: `aquai-v2-foundation`

## Server boundary

Browser → Next.js API route → server-side Gemini client → Google Gemini Interactions API.

The browser never receives `GEMINI_API_KEY` and never calls Google Gemini directly.

## Affiliate pipeline APIs

### 1. Reference Intelligence
`POST /api/reference/analyze`

Input: multipart image + `role` + `referenceId`.

Output: structured Reference DNA with visual facts, identity anchors, continuity rules, and forbidden assumptions.

### 2. Product Auto Description
`POST /api/affiliate/product-description`

Input: product name, category, product Reference DNA.

Output: factual product description plus visual claims and excluded claims.

### 3. Scene Planner
`POST /api/affiliate/scene-plan`

Input:
- Affiliate settings
- Character/Product/Background Reference DNA

Output:
- exact requested scene count
- objective
- action
- character performance
- product interaction
- camera
- lighting
- environment
- dialogue
- image prompt
- video prompt
- continuity locks

The API rejects a planner request without Product Reference DNA.

### 4. Scene Image Generator
`POST /api/affiliate/scene-image`

Input: multipart scene prompt + scene number + aspect ratio + resolution + up to three reference images.

Output: generated complete scene image as base64 plus model metadata.

The image model is server-configured through `GEMINI_IMAGE_MODEL` and defaults to `gemini-3.1-flash-image`.

The generated frame is explicitly instructed to reconstruct one coherent scene from the references, not paste or collage the reference images.

### 5. Final Prompt Compiler
`POST /api/affiliate/final-prompt`

Input:
- Affiliate settings
- one scene plan
- Reference DNA

Output: one clean Google Flow / GEMS-compatible production prompt.

## Environment variables

- `GEMINI_API_KEY` — required, server-only.
- `GEMINI_VISION_MODEL` — Reference Intelligence model.
- `GEMINI_SCENE_MODEL` — Scene Planner model.
- `GEMINI_PROMPT_MODEL` — Final Prompt Compiler model.
- `GEMINI_IMAGE_MODEL` — native image-generation model.

## Failure policy

API failures are explicit. No fake delay, placeholder success, random quality score, random lock score, or hardcoded successful image is allowed in the production pipeline.

## Next integration step

Connect `AffiliateStudio` to:

`GENERATE AQU → /api/affiliate/scene-plan → /api/affiliate/scene-image per scene → /api/affiliate/final-prompt per scene → render actual storyboard + prompt UI`

Regenerate Scene must call `/api/affiliate/scene-image` again for that exact scene rather than producing a local variation.
