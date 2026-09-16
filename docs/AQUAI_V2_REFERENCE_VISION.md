# AQU.AI V2 — Reference Vision Analysis

## Purpose

The Reference Upload Engine now sends the actual uploaded image bytes from the Chrome browser to an AQU.AI server route. The server calls Gemini Vision and returns structured Reference DNA.

## Runtime flow

```text
Chrome upload
  -> POST /api/reference/analyze (multipart/form-data)
  -> server validates type/size
  -> server converts image bytes to base64
  -> Gemini multimodal model
  -> structured JSON
  -> Reference DNA
  -> UI status: Analyzed / Ground Truth Locked
```

## Security boundary

- `GEMINI_API_KEY` is server-side only.
- The key must not use a `NEXT_PUBLIC_` variable.
- The browser never calls the Gemini API directly.
- The browser sends only the reference asset to the AQU.AI route.

## Evidence discipline

Every extracted visual fact has one of:

- `observed`
- `uncertain`
- `not_visible`

Downstream scene and prompt engines must preserve this distinction. Uncertain or not-visible data must never be promoted into a confident visual fact.

## Current model

The default environment value is `gemini-3.6-flash`, with `GEMINI_VISION_MODEL` available for controlled model selection.

## Required environment

```text
GEMINI_API_KEY=...
GEMINI_VISION_MODEL=gemini-3.6-flash
```

## Current output contract

The endpoint returns:

- `referenceId`
- `role`
- `status`
- `model`
- `analyzedAt`
- `dna.summary`
- `dna.visualFacts[]`
- `dna.identityAnchors[]`
- `dna.continuityRules[]`
- `dna.forbiddenAssumptions[]`

This contract is intentionally independent from the UI so the future Scene Planner, storyboard renderer, and final prompt compiler can consume the same Reference DNA.
