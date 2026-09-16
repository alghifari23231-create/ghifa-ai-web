# AQU.AI V2 — Tahap 2: Reference Intelligence

## Purpose

Reference Intelligence converts uploaded visual references into structured, auditable visual facts that downstream scene generation can consume without inventing identity details.

## Reference roles

A reference asset has an explicit role:

- `character`
- `product`
- `background`
- `object`

Affiliate Pro may use character + product + background. Other modules may define their own allowed reference roles, but must not display irrelevant reference inputs.

## Processing pipeline

```text
UPLOAD
  ↓
VALIDATE ASSET
  ↓
EXTRACT IMAGE METADATA
  ↓
VISION ANALYSIS
  ↓
STRUCTURED VISUAL FACTS
  ↓
REFERENCE DNA
  ↓
IDENTITY LOCK
  ↓
READY FOR SCENE ENGINE
```

A successful upload does not equal a successful analysis. The UI must distinguish `uploaded`, `analyzing`, `analyzed`, `failed`, and `locked` states.

## Asset contract

```ts
export type ReferenceRole =
  | 'character'
  | 'product'
  | 'background'
  | 'object';

export type ReferenceStatus =
  | 'uploaded'
  | 'analyzing'
  | 'analyzed'
  | 'failed'
  | 'locked';

export interface ReferenceAsset {
  id: string;
  role: ReferenceRole;
  fileName: string;
  mimeType: string;
  width?: number;
  height?: number;
  status: ReferenceStatus;
  sourceUrl: string;
  analysisId?: string;
  error?: string;
}
```

## Character DNA

The vision model should extract only visible, supportable attributes. It should not infer sensitive identity attributes or fabricate hidden details.

```ts
export interface CharacterDNA {
  visibleIdentity: {
    faceShape?: string;
    facialFeatures?: string[];
    skinAppearance?: string;
    hairOrHijab?: string;
    bodyProportions?: string;
  };
  wardrobe: {
    garments?: string[];
    colors?: string[];
    materials?: string[];
    accessories?: string[];
    footwear?: string;
  };
  distinctiveVisibleDetails?: string[];
  confidenceByField: Record<string, number>;
}
```

## Product DNA

```ts
export interface ProductDNA {
  category?: string;
  shape?: string;
  relativeScale?: string;
  material?: string;
  colors?: string[];
  designDetails?: string[];
  markingsOrLogo?: string[];
  visibleFunctionalFeatures?: string[];
  confidenceByField: Record<string, number>;
}
```

## Background DNA

```ts
export interface BackgroundDNA {
  environment?: string;
  walls?: string[];
  floor?: string;
  furnitureAndObjects?: string[];
  spatialLayout?: string;
  lighting?: string[];
  visibleGeometry?: string[];
  confidenceByField: Record<string, number>;
}
```

## Object DNA

```ts
export interface ObjectDNA {
  type?: string;
  shape?: string;
  material?: string;
  colors?: string[];
  visibleDetails?: string[];
  function?: string;
  confidenceByField: Record<string, number>;
}
```

## Evidence rule

Every extracted field must be classified internally as:

- `observed` — directly visible in the reference
- `uncertain` — partially visible or ambiguous
- `not_visible` — cannot be established from the reference

Downstream prompt compilation must never turn `uncertain` or `not_visible` information into a confident visual fact.

## Reference DNA envelope

```ts
export interface ReferenceDNA {
  character?: CharacterDNA;
  product?: ProductDNA;
  background?: BackgroundDNA;
  object?: ObjectDNA;
  sourceAssetIds: string[];
  analyzedAt: string;
  model?: string;
  version: string;
}
```

## Identity Lock contract

```ts
export interface IdentityLock {
  referenceDNAId: string;
  immutableFields: string[];
  continuityRules: string[];
  allowedSceneChanges: string[];
  lockedAt: string;
  version: string;
}
```

Default continuity behavior:

1. Character identity remains consistent across scenes.
2. Body proportions remain consistent with the reference.
3. Clothing/accessories remain unchanged unless a scene explicitly requests a change.
4. Product geometry, material, color, markings, and relative scale remain consistent.
5. Background remains the same environment when continuity is requested.
6. Camera movement may reveal existing spatial context but may not replace the environment with an invented one.

## Vision request boundary

Reference images must be supplied to the server-side vision service as actual image input. A filename, placeholder URL, or generic upload message is not sufficient evidence for visual analysis.

The client must never contain the provider API secret. The server owns provider credentials and records the analysis model/version used.

## Failure behavior

If analysis fails:

- keep the original asset available;
- mark analysis as `failed`;
- show the actual failure state to the user;
- do not create fake DNA;
- do not silently substitute a generic description;
- allow retry.

## UI requirements

The Reference Workspace must show:

- role of each reference;
- thumbnail/preview of the actual uploaded asset;
- analysis status;
- structured visual findings after analysis;
- lock status after Identity Lock is created;
- clear retry behavior for failures.

The workspace must not present a reference as "AI analyzed" merely because a file upload succeeded.

## Acceptance criteria

Tahap 2 is complete only when:

- real reference bytes reach the vision-analysis service;
- character/product/background/object findings are structured;
- no generic hardcoded description is used as analysis output;
- Reference DNA is persisted as structured data;
- Identity Lock is derived from Reference DNA;
- analysis failure is visible and recoverable;
- downstream scene generation can consume Reference DNA + Identity Lock;
- no provider secret is stored in browser LocalStorage.
