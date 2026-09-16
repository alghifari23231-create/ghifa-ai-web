export const AFFILIATE_VIDEO_STYLES = [
  "Storytelling",
  "Product Review",
  "POV Experience",
  "GRWM",
  "Unboxing",
  "Before & After",
  "Daily Lifestyle",
  "Comparison",
  "Problem → Solution",
  "Tutorial / How-To",
  "Reaction",
  "Recommendation",
  "Lainnya",
] as const;

export const CONTENT_INTENTS = ["Curious", "Interested", "Relatable", "Impressed", "Want to try"] as const;
export const BODY_TYPES = ["Auto", "Slim", "Athletic", "Average", "Curvy", "Petite"] as const;
export const PRODUCT_CATEGORIES = [
  "Fashion",
  "Beauty",
  "Skincare",
  "Makeup",
  "Electronics",
  "Home & Living",
  "Food & Beverage",
  "Accessories",
  "Gadget",
  "Health & Wellness",
  "Other",
] as const;
export const DURATIONS = [6, 8, 10, 15, 30] as const;
export const ASPECT_RATIOS = ["9:16", "16:9", "1:1"] as const;
export const DIALOG_LANGUAGES = ["Indonesia", "English", "Japanese", "Korean", "Chinese"] as const;
export const CAMERA_TYPES = ["Automatic", "Handheld", "Tripod", "Gimbal", "Dolly", "Crane", "Drone", "Static"] as const;
export const SHOT_TYPES = ["Auto", "Extreme Close-Up", "Close-Up", "Medium", "Medium Full", "Full Shot", "Wide Shot", "Extreme Wide"] as const;
export const CAMERA_MOVEMENTS = ["Auto", "Static", "Push In", "Pull Out", "Pan", "Tilt", "Dolly In", "Dolly Out", "Tracking", "Orbit"] as const;
export const LIGHTING = ["Auto", "Natural Daylight", "Soft Window Light", "Golden Hour", "Studio Softbox", "High Key", "Low Key", "Moody Ambient"] as const;
export const FPS_OPTIONS = [24, 25, 30, 60] as const;
export const RESOLUTIONS = ["1080p", "2K", "4K"] as const;
export const FOCUS_MODES = ["Auto", "Face Priority", "Product Priority", "Deep Focus", "Shallow Depth"] as const;
export const STABILIZATION = ["Auto", "Off", "Standard", "High"] as const;

export type AffiliateSettings = {
  module: "affiliate";
  character: {
    name: string;
    weightKg: string;
    bodyType: (typeof BODY_TYPES)[number];
    customClothing: string;
    customAccessories: string;
  };
  story: {
    videoStyle: (typeof AFFILIATE_VIDEO_STYLES)[number];
    contentIntent: (typeof CONTENT_INTENTS)[number];
  };
  product: {
    name: string;
    category: (typeof PRODUCT_CATEGORIES)[number];
    autoDescription: string;
    referenceId: string | null;
  };
  video: {
    sceneCount: number;
    durationSeconds: (typeof DURATIONS)[number];
    aspectRatio: (typeof ASPECT_RATIOS)[number];
    dialogEnabled: boolean;
    dialogLanguage: (typeof DIALOG_LANGUAGES)[number];
    cameraType: (typeof CAMERA_TYPES)[number];
    shotType: (typeof SHOT_TYPES)[number];
    cameraMovement: (typeof CAMERA_MOVEMENTS)[number];
    lighting: (typeof LIGHTING)[number];
    fps: (typeof FPS_OPTIONS)[number];
    resolution: (typeof RESOLUTIONS)[number];
    focusMode: (typeof FOCUS_MODES)[number];
    stabilization: (typeof STABILIZATION)[number];
  };
};

export const DEFAULT_AFFILIATE_SETTINGS: AffiliateSettings = {
  module: "affiliate",
  character: { name: "", weightKg: "", bodyType: "Auto", customClothing: "", customAccessories: "" },
  story: { videoStyle: "Storytelling", contentIntent: "Relatable" },
  product: { name: "", category: "Fashion", autoDescription: "", referenceId: null },
  video: {
    sceneCount: 6,
    durationSeconds: 8,
    aspectRatio: "9:16",
    dialogEnabled: true,
    dialogLanguage: "Indonesia",
    cameraType: "Automatic",
    shotType: "Auto",
    cameraMovement: "Auto",
    lighting: "Auto",
    fps: 30,
    resolution: "1080p",
    focusMode: "Auto",
    stabilization: "Auto",
  },
};

export function buildAffiliateScenePlannerInput(settings: AffiliateSettings, referenceDNA: unknown) {
  return {
    module: settings.module,
    character: settings.character,
    story: settings.story,
    product: settings.product,
    video: settings.video,
    referenceDNA,
    rules: {
      referenceIsVisualGroundTruth: true,
      noInventedVisualFacts: true,
      preserveIdentityAcrossScenes: true,
      productVisibleFromSceneOne: true,
    },
  };
}
