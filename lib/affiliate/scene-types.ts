import type { ReferenceDNA } from "../reference-intelligence/types";
import type { AffiliateSettings } from "./settings";

export type AffiliateReferenceDNA = {
  character: ReferenceDNA | null;
  product: ReferenceDNA | null;
  background: ReferenceDNA | null;
};

export type AffiliateScenePlan = {
  sceneNumber: number;
  title: string;
  objective: string;
  durationSeconds: number;
  action: string;
  characterPerformance: string;
  productInteraction: string;
  camera: string;
  lighting: string;
  environment: string;
  dialogue: string;
  imagePrompt: string;
  videoPrompt: string;
  continuityLocks: string[];
};

export type AffiliateScenePlanResponse = {
  module: "affiliate";
  model: string;
  generatedAt: string;
  settings: AffiliateSettings;
  scenes: AffiliateScenePlan[];
};

export type AffiliateSceneImageResponse = {
  sceneNumber: number;
  model: string;
  mimeType: string;
  imageBase64: string;
  generatedAt: string;
};
