# AQU.AI V2 — Studio Contract

## 1. Product Navigation

AQU.AI has two distinct UI levels:

1. **Home / Creative Tools Directory**
   - Shows AQU.AI branding and module cards only.
   - Modules: Affiliate Pro, Podcast, Vlog, Cinematic Cinema, Cartoon Animasi.
   - Selecting a card opens that module's Studio.
2. **Module Studio**
   - The selected module controls its own fields, workflow, defaults, and generated outputs.
   - Home must not display Studio controls.

## 2. Studio Layout

The Studio uses three primary panels:

### Left — Reference Panel

Purpose: upload and manage visual reference assets.

Affiliate Pro requires:
- Character Reference
- Product Reference
- Background Reference

Other modules use module-appropriate reference/object slots and must not show Affiliate-only Product Reference controls.

Each reference asset has an explicit lifecycle:
`Empty → Uploaded → Analyzing → Analyzed → Locked` or `Failed`.

The UI must show the actual uploaded thumbnail. Reference assets are visual ground truth and are never replaced by generic placeholder images in generated scene output.

### Center — Story & Module Settings

Affiliate Pro fields:

**Character / creator inputs**
- Name — manual text input
- Weight — manual numeric input
- Body Type — selectable option
- Custom Clothing — manual text input
- Custom Accessories — manual text input

**Video Style**

Selectable style cards/options. Initial styles:
- Storytelling
- Product Review
- POV Experience
- GRWM
- Unboxing
- Before & After
- Daily Lifestyle
- Tutorial / How-To
- Comparison
- Problem → Solution
- Reaction
- Recommendation
- Other / Custom

The style is descriptive of the content format and storytelling approach. Do not use `Realistic` as a video-style category; realism is a rendering/quality requirement, not a content style.

**Product inputs**
- Product Name — manual text input
- Product Category — selectable option with Auto Detect support
- AI Product Description — generated automatically from the product reference and product metadata; it is not a hardcoded template

**Video Parameters**
- Scene Count
- Duration per Scene: `6s`, `8s`, `10s`, `15s`, `30s`
- Aspect Ratio
- Dialogue On/Off
- Dialogue Language
- Camera Type
- Camera Movement
- Shot Type / Framing
- Lighting
- Visual Quality / Render Style
- Motion Intensity
- Continuity Lock

Additional module-specific parameters may be added without changing the three-panel layout.

## 3. Right — Output Panel

The right panel is **not** a reference gallery and must never simply repeat uploaded reference photos.

It is the generated production workspace containing a sequential list of scenes.

For every scene:

```text
Scene N
├── Rendered Scene Image / Storyboard Frame
│   ├── Save
│   └── Regenerate
└── Final Video Prompt
    ├── Save
    ├── Copy
    └── Regenerate
```

Scene output must represent a complete composed scene using the relevant Reference DNA, Identity Lock, story intent, product information, environment, camera, and motion parameters.

A reference photo alone is never considered a rendered storyboard scene.

Scenes are displayed in order:
`Scene 01 → Scene 02 → ... → Scene N`.

The number of scene cards must equal the selected Scene Count.

## 4. Scene Data Contract

Each scene should carry at minimum:

- scene id / index
- duration
- scene title or beat
- action / visual direction
- dialogue (when enabled)
- camera direction
- image generation status
- rendered image asset (when generated)
- final video prompt
- prompt generation status
- save state
- error state / retry state

## 5. Generation Rules

`Generate` must execute the actual pipeline. UI timers or arbitrary delays must not be used as a substitute for processing.

Pipeline:

`Reference Assets → Vision Analysis → Reference DNA → Identity Lock → Story Plan → Scene Plan → Scene Image Generation → Final Video Prompt Compilation`

A scene is only marked generated when its corresponding output actually exists.

Regenerate Scene Image must invoke the scene-image generation path for that scene.

Regenerate Final Prompt must invoke the prompt compiler for that scene using the current scene data and locked reference context.

Errors must be explicit and recoverable. Never substitute fake success, random quality scores, random lock scores, generic product templates, or unrelated placeholder imagery.

## 6. State Isolation

Every module has an independent initial-default settings object.

Changing Affiliate settings must not mutate Podcast, Vlog, Cinematic Cinema, or Cartoon Animasi settings.

Switching modules must load that module's defaults unless a future project-persistence feature explicitly restores a saved project.

## 7. Gemini + Canva Compatibility

AQU.AI is a web application intended to be usable alongside Gemini and Canva.

The UI must therefore:
- remain browser-based and responsive;
- keep generated images and prompts easy to save/copy/export;
- avoid assumptions about a specific desktop runtime;
- keep provider credentials out of browser local storage;
- keep AI-provider calls behind a server-side boundary;
- make scene images and final prompts independently reusable in downstream creative tools.

Gemini/Canva compatibility does not replace AQU.AI's own module, reference, scene, and prompt contracts.

## 8. Implementation Order

After this contract is locked, implementation proceeds in this order:

1. Reference Upload Engine
2. Reference Analysis / Reference DNA
3. Module Settings State + validation
4. Story / Scene Planner
5. Per-scene image generation adapter
6. Per-scene prompt compiler
7. Save / Copy / Regenerate actions
8. Project persistence and export

The first implementation milestone is the **Reference Upload Engine**, because every downstream scene-generation step depends on real reference assets and structured visual grounding.
