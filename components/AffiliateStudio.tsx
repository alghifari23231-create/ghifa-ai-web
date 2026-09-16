"use client";

import { ChangeEvent, DragEvent, useMemo, useState } from "react";
import type { VisionAnalysisResponse } from "../lib/reference-intelligence/types";
import {
  AFFILIATE_VIDEO_STYLES,
  ASPECT_RATIOS,
  BODY_TYPES,
  CAMERA_MOVEMENTS,
  CAMERA_TYPES,
  CONTENT_INTENTS,
  DEFAULT_AFFILIATE_SETTINGS,
  DIALOG_LANGUAGES,
  DURATIONS,
  FOCUS_MODES,
  FPS_OPTIONS,
  LIGHTING,
  PRODUCT_CATEGORIES,
  RESOLUTIONS,
  SHOT_TYPES,
  STABILIZATION,
  type AffiliateSettings,
  buildAffiliateScenePlannerInput,
} from "../lib/affiliate/settings";

type ReferenceAsset = {
  id: string;
  name: string;
  size: number;
  type: string;
  previewUrl: string;
  status: "uploaded" | "analyzing" | "analyzed" | "failed";
  error?: string;
  analysis?: VisionAnalysisResponse;
};

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const sceneTemplates = [
  ["01", "Hook"], ["02", "Discovery"], ["03", "Interaction"], ["04", "Demonstration"],
  ["05", "Reaction"], ["06", "Closing"], ["07", "Detail"], ["08", "CTA"],
] as const;

function formatSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function selectClass(selected: boolean) {
  return selected ? "selected" : "";
}

export function AffiliateStudio({ onBack }: { onBack: () => void }) {
  const [settings, setSettings] = useState<AffiliateSettings>(DEFAULT_AFFILIATE_SETTINGS);
  const [references, setReferences] = useState<Record<string, ReferenceAsset | null>>({
    character: null,
    product: null,
    background: null,
  });
  const [dragging, setDragging] = useState<string | null>(null);
  const [activeScene, setActiveScene] = useState(0);
  const [tab, setTab] = useState<"storyboard" | "prompt">("storyboard");
  const [descriptionState, setDescriptionState] = useState<"idle" | "generating" | "ready" | "failed">("idle");
  const [descriptionError, setDescriptionError] = useState("");
  const [descriptionClaims, setDescriptionClaims] = useState<string[]>([]);

  const productDNA = references.product?.analysis?.dna;
  const analyzedCount = Object.values(references).filter((asset) => asset?.status === "analyzed").length;
  const analyzingCount = Object.values(references).filter((asset) => asset?.status === "analyzing").length;
  const visibleScenes = useMemo(() => sceneTemplates.slice(0, settings.video.sceneCount), [settings.video.sceneCount]);
  const sceneDuration = settings.video.durationSeconds;
  const totalDuration = settings.video.sceneCount * sceneDuration;

  const update = <K extends keyof AffiliateSettings>(section: K, patch: Partial<AffiliateSettings[K]>) => {
    setSettings((prev) => ({ ...prev, [section]: { ...(prev[section] as object), ...patch } } as AffiliateSettings));
  };

  const addReference = (role: "character" | "product" | "background", file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setReferences((prev) => ({ ...prev, [role]: { id: `${role}-error`, name: file.name, size: file.size, type: file.type, previewUrl: "", status: "failed", error: "Format harus JPG, PNG, atau WEBP." } }));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setReferences((prev) => ({ ...prev, [role]: { id: `${role}-error`, name: file.name, size: file.size, type: file.type, previewUrl: "", status: "failed", error: "Ukuran maksimum 15 MB." } }));
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    const id = `${role}-${crypto.randomUUID()}`;
    setReferences((prev) => {
      const old = prev[role];
      if (old?.previewUrl) URL.revokeObjectURL(old.previewUrl);
      return { ...prev, [role]: { id, name: file.name, size: file.size, type: file.type, previewUrl, status: "uploaded" } };
    });
    void analyzeReference(role, file, id);
  };

  const analyzeReference = async (role: "character" | "product" | "background", file: File, referenceId: string) => {
    setReferences((prev) => ({ ...prev, [role]: prev[role] ? { ...prev[role]!, status: "analyzing", error: undefined } : prev[role] }));
    const form = new FormData();
    form.append("file", file);
    form.append("role", role);
    form.append("referenceId", referenceId);
    try {
      const response = await fetch("/api/reference/analyze", { method: "POST", body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Vision Analysis gagal.");
      setReferences((prev) => prev[role] ? { ...prev, [role]: { ...prev[role]!, status: "analyzed", analysis: payload as VisionAnalysisResponse } } : prev);
      if (role === "product") update("product", { referenceId });
    } catch (error) {
      setReferences((prev) => prev[role] ? { ...prev, [role]: { ...prev[role]!, status: "failed", error: error instanceof Error ? error.message : "Vision Analysis gagal." } } : prev);
    }
  };

  const onFileChange = (role: "character" | "product" | "background", event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) addReference(role, file);
    event.target.value = "";
  };

  const onDrop = (role: "character" | "product" | "background", event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(null);
    const file = event.dataTransfer.files?.[0];
    if (file) addReference(role, file);
  };

  const removeReference = (role: "character" | "product" | "background") => {
    setReferences((prev) => {
      const old = prev[role];
      if (old?.previewUrl) URL.revokeObjectURL(old.previewUrl);
      return { ...prev, [role]: null };
    });
    if (role === "product") update("product", { referenceId: null, autoDescription: "" });
  };

  const generateDescription = async () => {
    if (!settings.product.name.trim() || !productDNA) return;
    setDescriptionState("generating");
    setDescriptionError("");
    try {
      const response = await fetch("/api/affiliate/product-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName: settings.product.name, category: settings.product.category, referenceDNA: productDNA }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Auto Description gagal.");
      update("product", { autoDescription: String(payload.description || "") });
      setDescriptionClaims(Array.isArray(payload.visualClaims) ? payload.visualClaims : []);
      setDescriptionState("ready");
    } catch (error) {
      setDescriptionState("failed");
      setDescriptionError(error instanceof Error ? error.message : "Auto Description gagal.");
    }
  };

  const plannerInput = useMemo(() => buildAffiliateScenePlannerInput(
    settings,
    {
      character: references.character?.analysis?.dna || null,
      product: references.product?.analysis?.dna || null,
      background: references.background?.analysis?.dna || null,
    },
  ), [settings, references]);

  const canGenerate = analyzedCount >= 1 && Boolean(settings.product.name.trim()) && Boolean(productDNA);

  const referenceCard = (role: "character" | "product" | "background", title: string, helper: string) => {
    const asset = references[role];
    return (
      <div className="reference-card" key={role}>
        <div className="reference-card-head"><b>{title}</b><span className={asset?.status === "analyzed" ? "status-ok" : asset?.status === "failed" ? "status-error" : "status-wait"}>{asset?.status === "analyzed" ? "Analyzed ✓" : asset?.status === "analyzing" ? "Analyzing…" : asset?.status === "failed" ? "Failed" : "Waiting"}</span></div>
        {asset?.previewUrl ? (
          <div className="reference-preview"><img src={asset.previewUrl} alt={`${title} preview`} /><div className="preview-overlay"><span>{formatSize(asset.size)}</span><button type="button" onClick={() => removeReference(role)}>Remove</button></div></div>
        ) : (
          <div className={`upload-zone ${dragging === role ? "dragging" : ""}`} onDragOver={(e) => { e.preventDefault(); setDragging(role); }} onDragLeave={() => setDragging(null)} onDrop={(e) => onDrop(role, e)}>
            <input id={`affiliate-upload-${role}`} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onFileChange(role, e)} />
            <label htmlFor={`affiliate-upload-${role}`}><strong>＋</strong><span>{dragging === role ? "Drop image here" : "Upload reference"}</span><small>JPG · PNG · WEBP · max 15 MB</small></label>
          </div>
        )}
        {asset?.status === "failed" ? <div className="reference-error">{asset.error}</div> : <div className="reference-file">{asset ? <><b>{asset.name}</b><span>{formatSize(asset.size)} · {asset.status === "analyzed" ? "Reference DNA ready" : asset.status === "analyzing" ? "Vision Analysis sedang berjalan" : "Menunggu Vision Analysis"}</span></> : <span>{helper}</span>}</div>}
        {asset?.analysis?.dna && <div className="analysis-summary"><b>Reference DNA</b><p>{asset.analysis.dna.summary}</p><div>{asset.analysis.dna.identityAnchors.slice(0, 4).map((item) => <span key={item}>• {item}</span>)}</div></div>}
        <div className="reference-actions">{asset?.status === "analyzed" && <span className="ground-truth-badge">● Ground Truth Locked</span>}{asset && <label className="replace-button" htmlFor={`affiliate-replace-${role}`}>Replace<input id={`affiliate-replace-${role}`} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onFileChange(role, e)} /></label>}</div>
      </div>
    );
  };

  return (
    <main className="studio-shell">
      <aside className="studio-sidebar">
        <button className="side-brand" onClick={onBack}><span className="brand-orbit">◉</span><span><b>AQU.AI</b><small>CREATIVE STUDIO</small></span></button>
        <nav><button onClick={onBack}>⌂ <span>Dashboard</span></button><button className="active">✦ <span>Affiliate Pro</span></button><button>▣ <span>Projects</span></button><button>▧ <span>Assets</span></button><button>⚙ <span>Settings</span></button></nav>
        <div className="side-card"><b>AQU.AI</b><p>Affiliate Pro dikembangkan dan diuji lebih dulu. Reference tetap menjadi visual ground truth.</p><div className="wave">∿∿∿</div></div>
      </aside>

      <section className="studio-main">
        <header className="studio-topbar"><button className="back-link" onClick={onBack}>← Semua Studio</button><span>Affiliate-first AI creative workflow</span><div>Tyas　⌄</div></header>
        <div className="studio-titlebar"><div className="studio-icon">✦</div><div><h1>Affiliate Pro</h1><p>Story, reference intelligence, scene planning, dan prompt dalam satu workflow.</p></div><div className="stepper">{["References", "Story", "Scenes", "Storyboard", "Final Prompt"].map((x, i) => <div className={i === 0 ? "step current" : "step"} key={x}><span>{i + 1}</span>{x}</div>)}</div></div>

        <div className="studio-grid">
          <section className="workspace-column">
            <div className="panel">
              <div className="section-heading"><div><h2>1. References</h2><p>Upload reference asli. Foto tidak ditempel sebagai storyboard; DNA visualnya menjadi ground truth.</p></div><span className="upload-count">{analyzedCount}/3 Analyzed</span></div>
              <div className="reference-grid">
                {referenceCard("character", "Character Reference", "Upload foto karakter utama.")}
                {referenceCard("product", "Product Reference", "Upload foto produk yang akan direview.")}
                {referenceCard("background", "Background Reference", "Upload environment/background bila tersedia.")}
              </div>
              <div className="reference-engine-note"><span>◈</span><div><b>Reference Intelligence aktif</b><p>{analyzingCount > 0 ? `${analyzingCount} reference sedang dianalisis Gemini Vision.` : analyzedCount > 0 ? `${analyzedCount} reference sudah memiliki Reference DNA terstruktur.` : "Upload foto untuk memulai Vision Analysis."}</p></div></div>
            </div>

            <div className="panel">
              <h2>2. Story & Affiliate Settings</h2>
              <p>Semua nilai di bawah menjadi structured input untuk Scene Planner Affiliate Pro.</p>
              <div className="field-section"><h3>Character</h3><div className="control-grid"><label>Nama<input value={settings.character.name} onChange={(e) => update("character", { name: e.target.value })} placeholder="Nama karakter" /></label><label>Berat (kg)<input inputMode="decimal" value={settings.character.weightKg} onChange={(e) => update("character", { weightKg: e.target.value })} placeholder="50" /></label><label>Body Type<select value={settings.character.bodyType} onChange={(e) => update("character", { bodyType: e.target.value as AffiliateSettings["character"]["bodyType"] })}>{BODY_TYPES.map((x) => <option key={x}>{x}</option>)}</select></label></div><div className="control-grid"><label>Custom Clothing<textarea value={settings.character.customClothing} onChange={(e) => update("character", { customClothing: e.target.value })} placeholder="Kosongkan jika mengikuti reference." /></label><label>Custom Accessories<textarea value={settings.character.customAccessories} onChange={(e) => update("character", { customAccessories: e.target.value })} placeholder="Kosongkan jika mengikuti reference." /></label></div></div>

              <div className="field-section"><h3>Video Style</h3><div className="option-grid">{AFFILIATE_VIDEO_STYLES.map((x) => <button type="button" className={selectClass(settings.story.videoStyle === x)} key={x} onClick={() => update("story", { videoStyle: x })}>{x}</button>)}</div><div className="intent-row"><span>Content Intent</span><div className="option-grid compact">{CONTENT_INTENTS.map((x) => <button type="button" className={selectClass(settings.story.contentIntent === x)} key={x} onClick={() => update("story", { contentIntent: x })}>{x}</button>)}</div></div></div>

              <div className="field-section"><h3>Product</h3><div className="control-grid"><label>Product Name<input value={settings.product.name} onChange={(e) => { update("product", { name: e.target.value }); if (descriptionState !== "idle") setDescriptionState("idle"); }} placeholder="Contoh: Tas ..." /></label><label>Product Category<select value={settings.product.category} onChange={(e) => { update("product", { category: e.target.value as AffiliateSettings["product"]["category"] }); if (descriptionState !== "idle") setDescriptionState("idle"); }}>{PRODUCT_CATEGORIES.map((x) => <option key={x}>{x}</option>)}</select></label></div><div className="ai-description"><div className="ai-description-head"><div><b>AI Auto Description</b><small>Hanya berdasarkan Product Reference DNA.</small></div><button type="button" onClick={generateDescription} disabled={!settings.product.name.trim() || !productDNA || descriptionState === "generating"}>{descriptionState === "generating" ? "Generating…" : "Generate Description"}</button></div><textarea value={settings.product.autoDescription} onChange={(e) => update("product", { autoDescription: e.target.value })} placeholder={productDNA ? "Klik Generate Description untuk analisis AI." : "Upload dan selesaikan Product Reference Analysis terlebih dahulu."} /><div className="description-status">{descriptionState === "ready" && <span className="status-ok">AI description ready ✓</span>}{descriptionState === "failed" && <span className="status-error">{descriptionError}</span>}{descriptionClaims.length > 0 && <span>{descriptionClaims.length} visual claims terverifikasi</span>}</div></div></div>

              <div className="field-section"><h3>3. Detailed Video Parameters</h3><div className="control-grid"><label>Jumlah Scene<select value={settings.video.sceneCount} onChange={(e) => { const n = Number(e.target.value); update("video", { sceneCount: n, }); setActiveScene((current) => Math.min(current, n - 1)); }}>{[4,5,6,7,8].map((x) => <option key={x} value={x}>{x}</option>)}</select></label><label>Durasi per Scene<select value={settings.video.durationSeconds} onChange={(e) => update("video", { durationSeconds: Number(e.target.value) as AffiliateSettings["video"]["durationSeconds"] })}>{DURATIONS.map((x) => <option key={x} value={x}>{x} detik</option>)}</select></label><label>Aspect Ratio<select value={settings.video.aspectRatio} onChange={(e) => update("video", { aspectRatio: e.target.value as AffiliateSettings["video"]["aspectRatio"] })}>{ASPECT_RATIOS.map((x) => <option key={x}>{x}</option>)}</select></label><label>Dialog Language<select value={settings.video.dialogLanguage} onChange={(e) => update("video", { dialogLanguage: e.target.value as AffiliateSettings["video"]["dialogLanguage"] })}>{DIALOG_LANGUAGES.map((x) => <option key={x}>{x}</option>)}</select></label><label>Camera Type<select value={settings.video.cameraType} onChange={(e) => update("video", { cameraType: e.target.value as AffiliateSettings["video"]["cameraType"] })}>{CAMERA_TYPES.map((x) => <option key={x}>{x}</option>)}</select></label><label>Shot Type<select value={settings.video.shotType} onChange={(e) => update("video", { shotType: e.target.value as AffiliateSettings["video"]["shotType"] })}>{SHOT_TYPES.map((x) => <option key={x}>{x}</option>)}</select></label><label>Camera Movement<select value={settings.video.cameraMovement} onChange={(e) => update("video", { cameraMovement: e.target.value as AffiliateSettings["video"]["cameraMovement"] })}>{CAMERA_MOVEMENTS.map((x) => <option key={x}>{x}</option>)}</select></label><label>Lighting<select value={settings.video.lighting} onChange={(e) => update("video", { lighting: e.target.value as AffiliateSettings["video"]["lighting"] })}>{LIGHTING.map((x) => <option key={x}>{x}</option>)}</select></label><label>FPS<select value={settings.video.fps} onChange={(e) => update("video", { fps: Number(e.target.value) as AffiliateSettings["video"]["fps"] })}>{FPS_OPTIONS.map((x) => <option key={x} value={x}>{x} fps</option>)}</select></label><label>Resolution<select value={settings.video.resolution} onChange={(e) => update("video", { resolution: e.target.value as AffiliateSettings["video"]["resolution"] })}>{RESOLUTIONS.map((x) => <option key={x}>{x}</option>)}</select></label><label>Focus Mode<select value={settings.video.focusMode} onChange={(e) => update("video", { focusMode: e.target.value as AffiliateSettings["video"]["focusMode"] })}>{FOCUS_MODES.map((x) => <option key={x}>{x}</option>)}</select></label><label>Stabilization<select value={settings.video.stabilization} onChange={(e) => update("video", { stabilization: e.target.value as AffiliateSettings["video"]["stabilization"] })}>{STABILIZATION.map((x) => <option key={x}>{x}</option>)}</select></label></div><div className="toggle-row"><span>Dialog</span><button type="button" className={settings.video.dialogEnabled ? "toggle on" : "toggle"} onClick={() => update("video", { dialogEnabled: !settings.video.dialogEnabled })}><i /></button><small>{settings.video.dialogEnabled ? `Dialog ${settings.video.dialogLanguage} aktif` : "Tanpa dialog"}</small></div></div>

              <div className="planner-ready"><span>◇</span><div><b>Scene Planner input siap</b><small>{settings.video.sceneCount} scene × {settings.video.durationSeconds}s = {totalDuration}s · {settings.video.aspectRatio} · {settings.video.cameraType}</small></div></div>
              <button className="generate-main" disabled={!canGenerate} onClick={() => setTab("storyboard")}>✦ GENERATE AQU</button>
              {!canGenerate && <small className="generate-hint">Wajib: minimal reference dianalisis + Product Name + Product Reference DNA.</small>}
            </div>
          </section>

          <section className="scene-column">
            <div className="panel scene-plan-panel">
              <div className="panel-heading"><div><h2>4. Storyboard / Output</h2><p>Setiap scene akan menjadi satu frame utuh; bukan foto reference mentah.</p></div><span className="scene-count">{visibleScenes.length} scenes</span></div>
              <div className="tab-row"><button className={tab === "storyboard" ? "active-tab" : ""} onClick={() => setTab("storyboard")}>Storyboard</button><button className={tab === "prompt" ? "active-tab" : ""} onClick={() => setTab("prompt")}>Final Prompt</button></div>
              <div className="scene-list">
                {visibleScenes.map(([number, title], i) => (
                  <button type="button" key={number} className={activeScene === i ? "scene-row scene-active" : "scene-row"} onClick={() => setActiveScene(i)}>
                    <div className={`scene-preview pv-${i % 6}`}><span>{number}</span></div>
                    <div className="scene-copy"><b>{number} — {title}</b><small>{i * sceneDuration}–{(i + 1) * sceneDuration}s</small><p>{tab === "storyboard" ? "Menunggu Scene Planner + Image Generation." : "Final GEMS prompt akan dikompilasi dari Reference DNA."}</p></div>
                  </button>
                ))}
              </div>
              <div className="scene-detail"><div className="scene-detail-head"><b>Scene {visibleScenes[activeScene]?.[0] || "01"}</b><span>{sceneDuration}s</span></div><div className="scene-detail-placeholder">{tab === "storyboard" ? "STORYBOARD FRAME" : "FINAL PROMPT"}<small>Output AI nyata akan terhubung setelah Scene Planner dan Image Generation selesai.</small></div></div>
              <details className="planner-contract"><summary>Scene Planner Contract</summary><pre>{JSON.stringify(plannerInput, null, 2)}</pre></details>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
