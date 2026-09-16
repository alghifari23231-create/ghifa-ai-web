# AQU.AI V2 — Tahap 1: Foundation

## 1. Product Contract

AQU.AI is an AI Video Prompt & Visual Scene Production Studio.

The non-negotiable product rule is:

> Reference images are the visual ground truth.

The application must never silently replace a reference with generic or hardcoded visual assumptions.

## 2. Core Pipeline

```text
REFERENCE UPLOAD
      ↓
REFERENCE ANALYSIS
      ↓
REFERENCE DNA
      ↓
IDENTITY LOCK
      ↓
MODULE INPUTS
      ↓
STORY / SCENE PLAN
      ↓
SCENE 1..N
      ↓
IMAGE PROMPT PER SCENE
      ↓
RENDERED SCENE IMAGE PER SCENE
      ↓
STORYBOARD GRID
      ↓
FINAL GEMS / GOOGLE FLOW PROMPT
```

Every stage produces structured data consumed by the next stage. UI state must not be used as the source of truth for generated content.

## 3. Application Boundaries

```text
AQU.AI
├── Dashboard
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
│   ├── Scene Planner
│   ├── Scene Continuity
│   ├── Dialogue
│   └── Camera / Motion
├── Image Generation Engine
├── Prompt Compiler
└── Project System
    ├── Save
    ├── Load
    ├── Regenerate Scene
    └── Export
```

## 4. State Isolation Rule

No module may inherit mutable settings from another module.

The domain model must represent module configuration explicitly. A studio session is created from immutable defaults plus the current user inputs. Switching modules must not mutate another module's configuration.

## 5. Reference DNA

Reference DNA is the canonical structured representation extracted from uploaded references. It is not a generated image and not a generic description.

Character DNA should cover visible identity attributes such as:
- face structure and visible facial features
- skin appearance
- hair / hijab
- body proportions
- clothing
- accessories
- visible distinctive details

Product DNA should cover:
- object type/category
- shape
- dimensions/relative scale
- material
- color
- construction/design
- logos/markings when visibly present
- functional visual characteristics

Background DNA should cover:
- location/environment type
- walls
- floor
- furniture/objects
- spatial layout
- visible lighting characteristics
- dominant visual geometry

## 6. Identity Lock

Identity Lock is a continuity contract generated from Reference DNA. It is attached to every scene request.

The lock must prevent unintended changes to:
- character identity
- body proportions
- clothing and accessories unless the scene explicitly changes them
- product identity
- background identity when continuity is required
- visual style established by the reference

Camera movement may reveal new portions of the same environment; it must not cause the system to invent a different environment.

## 7. Scene Contract

Every scene is a first-class object with:
- scene number
- duration
- purpose/action
- characters present
- products/objects present
- location/background
- camera
- framing
- lighting
- motion
- dialogue
- image prompt
- rendered image status
- video prompt
- continuity references

The number of storyboard images must equal the requested scene count.

## 8. Generation Rules

- Never use a placeholder reference image as the final storyboard render.
- Never cycle unrelated hardcoded product templates into user projects.
- Never report a fake quality/lock score.
- Never simulate completed AI processing with arbitrary delays when the operation has not completed.
- Generation errors must be explicit and recoverable.
- Regenerate Scene must call the scene generation pipeline with the existing scene context; it must not merely swap predefined text variations.

## 9. API Boundary

The browser owns presentation and user interaction.

Server-side services own:
- model/API credentials
- reference analysis requests
- image generation requests
- prompt compilation
- project persistence

Secrets must never be persisted as plaintext browser LocalStorage values.

## 10. Tahap 1 Deliverable

This stage establishes the product contract and architectural boundary before feature-specific implementation. Subsequent stages must implement against this contract rather than patching feature-specific shortcuts.
