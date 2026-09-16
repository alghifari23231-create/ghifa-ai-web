export type ReferenceRole = "character" | "product" | "background" | "object";

export type EvidenceStatus = "observed" | "uncertain" | "not_visible";

export type VisualFact = {
  field: string;
  value: string;
  evidence: EvidenceStatus;
};

export type ReferenceDNA = {
  role: ReferenceRole;
  summary: string;
  visualFacts: VisualFact[];
  identityAnchors: string[];
  continuityRules: string[];
  forbiddenAssumptions: string[];
};

export type VisionAnalysisResponse = {
  referenceId: string;
  role: ReferenceRole;
  status: "analyzed";
  model: string;
  analyzedAt: string;
  dna: ReferenceDNA;
};
