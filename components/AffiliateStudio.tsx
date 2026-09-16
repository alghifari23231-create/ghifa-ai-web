"use client";

import { ChangeEvent, DragEvent, useMemo, useState } from "react";
import type { VisionAnalysisResponse } from "../lib/reference-intelligence/types";
import type { AffiliateReferenceDNA, AffiliateScenePlan, AffiliateScenePlanResponse } from "../lib/affiliate/scene-types";
import { AFFILIATE_VIDEO_STYLES, ASPECT_RATIOS, BODY_TYPES, CAMERA_MOVEMENTS, CAMERA_TYPES, CONTENT_INTENTS, DEFAULT_AFFILIATE_SETTINGS, DIALOG_LANGUAGES, DURATIONS, FOCUS_MODES, FPS_OPTIONS, LIGHTING, PRODUCT_CATEGORIES, RESOLUTIONS, SHOT_TYPES, STABILIZATION, type AffiliateSettings } from "../lib/affiliate/settings";

type Role = "character" | "product" | "background";
type RefAsset = { id: string; name: string; size: number; type: string; file: File; previewUrl: string; status: "uploaded" | "analyzing" | "analyzed" | "failed"; error?: string; analysis?: VisionAnalysisResponse };
type SceneState = AffiliateScenePlan & { imageUrl?: string; prompt?: string; imageStatus?: "idle" | "generating" | "ready" | "failed"; promptStatus?: "idle" | "generating" | "ready" | "failed"; error?: string };
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const formatSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const selected = (v: boolean) => v ? "selected" : "";

export function AffiliateStudio({ onBack }: { onBack: () => void }) {
  const [settings, setSettings] = useState<AffiliateSettings>(DEFAULT_AFFILIATE_SETTINGS);
  const [references, setReferences] = useState<Record<Role, RefAsset | null>>({ character: null, product: null, background: null });
  const [dragging, setDragging] = useState<Role | null>(null);
  const [tab, setTab] = useState<"storyboard" | "prompt">("storyboard");
  const [activeScene, setActiveScene] = useState(0);
  const [scenes, setScenes] = useState<SceneState[]>([]);
  const [generation, setGeneration] = useState<"idle" | "planning" | "rendering" | "ready" | "failed">("idle");
  const [generationError, setGenerationError] = useState("");
  const [descriptionState, setDescriptionState] = useState<"idle" | "generating" | "ready" | "failed">("idle");
  const [descriptionError, setDescriptionError] = useState("");
  const [descriptionClaims, setDescriptionClaims] = useState<string[]>([]);
  const productDNA = references.product?.analysis?.dna;
  const analyzedCount = Object.values(references).filter(x => x?.status === "analyzed").length;
  const analyzingCount = Object.values(references).filter(x => x?.status === "analyzing").length;
  const totalDuration = settings.video.sceneCount * settings.video.durationSeconds;
  const referenceDNA: AffiliateReferenceDNA = useMemo(() => ({ character: references.character?.analysis?.dna || null, product: references.product?.analysis?.dna || null, background: references.background?.analysis?.dna || null }), [references]);
  const canGenerate = Boolean(settings.product.name.trim()) && Boolean(productDNA) && analyzedCount >= 1 && !["planning", "rendering"].includes(generation);
  const update = <K extends keyof AffiliateSettings>(section: K, patch: Partial<AffiliateSettings[K]>) => setSettings(prev => ({ ...prev, [section]: { ...(prev[section] as object), ...patch } } as AffiliateSettings));

  const analyzeReference = async (role: Role, file: File, id: string) => {
    setReferences(prev => prev[role] ? { ...prev, [role]: { ...prev[role]!, status: "analyzing", error: undefined } } : prev);
    const form = new FormData(); form.append("file", file); form.append("role", role); form.append("referenceId", id);
    try { const r = await fetch("/api/reference/analyze", { method: "POST", body: form }); const p = await r.json(); if (!r.ok) throw new Error(p.error || "Vision Analysis gagal."); setReferences(prev => prev[role] ? { ...prev, [role]: { ...prev[role]!, status: "analyzed", analysis: p as VisionAnalysisResponse } } : prev); if (role === "product") update("product", { referenceId: id }); }
    catch (e) { setReferences(prev => prev[role] ? { ...prev, [role]: { ...prev[role]!, status: "failed", error: e instanceof Error ? e.message : "Vision Analysis gagal." } } : prev); }
  };
  const addReference = (role: Role, file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE) { setReferences(prev => ({ ...prev, [role]: { id: `${role}-error`, name: file.name, size: file.size, type: file.type, file, previewUrl: "", status: "failed", error: !ACCEPTED_TYPES.includes(file.type) ? "Format harus JPG, PNG, atau WEBP." : "Ukuran maksimum 15 MB." } })); return; }
    const previewUrl = URL.createObjectURL(file); const id = `${role}-${crypto.randomUUID()}`;
    setReferences(prev => { if (prev[role]?.previewUrl) URL.revokeObjectURL(prev[role]!.previewUrl); return { ...prev, [role]: { id, name: file.name, size: file.size, type: file.type, file, previewUrl, status: "uploaded" } }; });
    void analyzeReference(role, file, id);
  };
  const onFileChange = (role: Role, e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) addReference(role, f); e.target.value = ""; };
  const onDrop = (role: Role, e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragging(null); const f = e.dataTransfer.files?.[0]; if (f) addReference(role, f); };
  const removeReference = (role: Role) => { setReferences(prev => { if (prev[role]?.previewUrl) URL.revokeObjectURL(prev[role]!.previewUrl); return { ...prev, [role]: null }; }); if (role === "product") update("product", { referenceId: null, autoDescription: "" }); };

  const generateDescription = async () => {
    if (!settings.product.name.trim() || !productDNA) return; setDescriptionState("generating"); setDescriptionError("");
    try { const r = await fetch("/api/affiliate/product-description", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productName: settings.product.name, category: settings.product.category, referenceDNA: productDNA }) }); const p = await r.json(); if (!r.ok) throw new Error(p.error || "Auto Description gagal."); update("product", { autoDescription: String(p.description || "") }); setDescriptionClaims(Array.isArray(p.visualClaims) ? p.visualClaims : []); setDescriptionState("ready"); }
    catch (e) { setDescriptionState("failed"); setDescriptionError(e instanceof Error ? e.message : "Auto Description gagal."); }
  };

  const generateImageForScene = async (index: number, scene: SceneState) => {
    setScenes(prev => prev.map((s, i) => i === index ? { ...s, imageStatus: "generating", error: undefined } : s));
    try {
      const form = new FormData(); form.append("prompt", scene.imagePrompt); form.append("sceneNumber", String(scene.sceneNumber)); form.append("aspectRatio", settings.video.aspectRatio); form.append("resolution", settings.video.resolution);
      const roleFields: Record<Role, string> = { character: "reference_character", product: "reference_product", background: "reference_background" };
      (Object.entries(references) as Array<[Role, RefAsset | null]>).forEach(([role, asset]) => { if (asset?.status === "analyzed") form.append(roleFields[role], asset.file); });
      const ir = await fetch("/api/affiliate/scene-image", { method: "POST", body: form }); const image = await ir.json(); if (!ir.ok) throw new Error(image.error || `Scene ${scene.sceneNumber} image gagal.`);
      const imageUrl = `data:${image.mimeType || "image/png"};base64,${image.imageBase64}`; setScenes(prev => prev.map((s, i) => i === index ? { ...s, imageUrl, imageStatus: "ready", error: undefined } : s));
    } catch (e) {
      setScenes(prev => prev.map((s, i) => i === index ? { ...s, imageStatus: "failed", error: e instanceof Error ? e.message : "Scene image generation gagal." } : s));
      throw e;
    }
  };

  const generatePromptForScene = async (index: number, scene: SceneState) => {
    setScenes(prev => prev.map((s, i) => i === index ? { ...s, promptStatus: "generating", error: undefined } : s));
    try {
      const pr = await fetch("/api/affiliate/final-prompt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings, scene, referenceDNA }) }); const prompt = await pr.json(); if (!pr.ok) throw new Error(prompt.error || `Scene ${scene.sceneNumber} Final Prompt gagal.`);
      setScenes(prev => prev.map((s, i) => i === index ? { ...s, prompt: String(prompt.finalPrompt || ""), promptStatus: "ready", error: undefined } : s));
    } catch (e) {
      setScenes(prev => prev.map((s, i) => i === index ? { ...s, promptStatus: "failed", error: e instanceof Error ? e.message : "Final Prompt generation gagal." } : s));
      throw e;
    }
  };

  const generateScene = async (index: number, scene: SceneState) => {
    const result = { image: false, prompt: false };
    try { await generateImageForScene(index, scene); result.image = true; } catch { /* keep prompt generation independent */ }
    try { await generatePromptForScene(index, scene); result.prompt = true; } catch { /* scene-level status already records the error */ }
    return result;
  };

  const buildScenes = async () => {
    if (!canGenerate) return; setGeneration("planning"); setGenerationError(""); setScenes([]); setActiveScene(0); setTab("storyboard");
    try {
      const r = await fetch("/api/affiliate/scene-plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings, referenceDNA }) });
      const p = await r.json() as AffiliateScenePlanResponse & { error?: string };
      if (!r.ok) throw new Error(p.error || "Scene Planner gagal.");
      const planned = p.scenes.map(s => ({ ...s, imageStatus: "idle" as const, promptStatus: "idle" as const }));
      setScenes(planned); setGeneration("rendering");
      const results: Array<{ image: boolean; prompt: boolean }> = [];
      for (let i = 0; i < planned.length; i++) results.push(await generateScene(i, planned[i]));
      const failedScenes = results.filter(x => !x.image || !x.prompt).length;
      const successfulScenes = results.length - failedScenes;
      setGeneration("ready");
      setGenerationError(failedScenes > 0 ? `${failedScenes} scene memiliki output yang gagal; ${successfulScenes} scene berhasil lengkap. Periksa status tiap scene dan gunakan Regenerate Image/Prompt pada bagian yang gagal.` : "");
    } catch (e) {
      setGeneration("failed"); setGenerationError(e instanceof Error ? e.message : "Generate AQU gagal.");
    }
  };

  const regenerateImage = async (i: number) => {
    const scene = scenes[i]; if (!scene || scene.imageStatus === "generating") return;
    setGeneration("rendering"); setGenerationError("");
    try { await generateImageForScene(i, scene); setGeneration("ready"); }
    catch (e) { setGeneration("failed"); setGenerationError(e instanceof Error ? e.message : "Regenerate image gagal."); }
  };

  const regeneratePrompt = async (i: number) => {
    const scene = scenes[i]; if (!scene || scene.promptStatus === "generating") return;
    setGeneration("rendering"); setGenerationError("");
    try { await generatePromptForScene(i, scene); setGeneration("ready"); }
    catch (e) { setGeneration("failed"); setGenerationError(e instanceof Error ? e.message : "Regenerate prompt gagal."); }
  };

  const saveImage = (s: SceneState) => { if (!s.imageUrl) return; const a = document.createElement("a"); a.href = s.imageUrl; a.download = `AQUAI-affiliate-scene-${s.sceneNumber}.png`; a.click(); };
  const savePrompt = (s: SceneState) => { if (!s.prompt) return; const url = URL.createObjectURL(new Blob([s.prompt], { type: "text/plain;charset=utf-8" })); const a = document.createElement("a"); a.href = url; a.download = `AQUAI-affiliate-scene-${s.sceneNumber}-prompt.txt`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  const copyPrompt = async (s: SceneState) => { if (s.prompt) await navigator.clipboard.writeText(s.prompt); };

  const referenceCard = (role: Role, title: string, helper: string) => { const a = references[role]; return <div className="reference-card" key={role}><div className="reference-card-head"><b>{title}</b><span className={a?.status === "analyzed" ? "status-ok" : a?.status === "failed" ? "status-error" : "status-wait"}>{a?.status === "analyzed" ? "Analyzed ✓" : a?.status === "analyzing" ? "Analyzing…" : a?.status === "failed" ? "Failed" : "Waiting"}</span></div>{a?.previewUrl ? <div className="reference-preview"><img src={a.previewUrl} alt={title} /><div className="preview-overlay"><span>{formatSize(a.size)}</span><button type="button" onClick={() => removeReference(role)}>Remove</button></div></div> : <div className={`upload-zone ${dragging === role ? "dragging" : ""}`} onDragOver={e => { e.preventDefault(); setDragging(role); }} onDragLeave={() => setDragging(null)} onDrop={e => onDrop(role, e)}><input id={`affiliate-upload-${role}`} type="file" accept="image/jpeg,image/png,image/webp" onChange={e => onFileChange(role, e)} /><label htmlFor={`affiliate-upload-${role}`}><strong>＋</strong><span>{dragging === role ? "Drop image here" : "Upload reference"}</span><small>JPG · PNG · WEBP · max 15 MB</small></label></div>}{a?.status === "failed" ? <div className="reference-error">{a.error}</div> : <div className="reference-file">{a ? <><b>{a.name}</b><span>{formatSize(a.size)} · {a.status === "analyzed" ? "Reference DNA ready" : "Vision Analysis sedang berjalan"}</span></> : <span>{helper}</span>}</div>}{a?.analysis?.dna && <div className="analysis-summary"><b>Reference DNA</b><p>{a.analysis.dna.summary}</p>{a.analysis.dna.identityAnchors.slice(0, 4).map(x => <span key={x}>• {x}</span>)}</div>}<div className="reference-actions">{a?.status === "analyzed" && <span className="ground-truth-badge">● Ground Truth Locked</span>}{a && <label className="replace-button" htmlFor={`affiliate-replace-${role}`}>Replace<input id={`affiliate-replace-${role}`} type="file" accept="image/jpeg,image/png,image/webp" onChange={e => onFileChange(role, e)} /></label>}</div></div>; };

  return <main className="studio-shell"><aside className="studio-sidebar"><button className="side-brand" onClick={onBack}><span className="brand-orbit">◉</span><span><b>AQU.AI</b><small>CREATIVE STUDIO</small></span></button><nav><button onClick={onBack}>⌂ <span>Dashboard</span></button><button className="active">✦ <span>Affiliate Pro</span></button><button>▣ <span>Projects</span></button><button>▧ <span>Assets</span></button><button>⚙ <span>Settings</span></button></nav><div className="side-card"><b>AQU.AI</b><p>Affiliate Pro dikembangkan dan diuji lebih dulu. Reference tetap menjadi visual ground truth.</p><div className="wave">∿∿∿</div></div></aside><section className="studio-main"><header className="studio-topbar"><button className="back-link" onClick={onBack}>← Semua Studio</button><span>Affiliate-first AI creative workflow</span><div>AQU.AI</div></header><div className="studio-titlebar"><div className="studio-icon">✦</div><div><h1>Affiliate Pro</h1><p>Story, reference intelligence, scene planning, storyboard, dan final prompt dalam satu workflow.</p></div><div className="stepper">{["References", "Story", "Scenes", "Storyboard", "Final Prompt"].map((x, i) => <div className={i === 0 ? "step current" : "step"} key={x}><span>{i + 1}</span>{x}</div>)}</div></div><div className="studio-grid"><section className="workspace-column"><div className="panel"><div className="section-heading"><div><h2>1. References</h2><p>Upload reference asli. Foto tidak ditempel sebagai storyboard; DNA visualnya menjadi ground truth.</p></div><span className="upload-count">{analyzedCount}/3 Analyzed</span></div><div className="reference-grid">{referenceCard("character", "Character Reference", "Upload foto karakter utama.")}{referenceCard("product", "Product Reference", "Upload foto produk yang akan direview.")}{referenceCard("background", "Background Reference", "Upload environment/background bila tersedia.")}</div><div className="reference-engine-note"><span>◈</span><div><b>Reference Intelligence aktif</b><p>{analyzingCount ? `${analyzingCount} reference sedang dianalisis Gemini Vision.` : analyzedCount ? `${analyzedCount} reference sudah memiliki Reference DNA terstruktur.` : "Upload foto untuk memulai Vision Analysis."}</p></div></div></div><div className="panel"><h2>2. Story & Affiliate Settings</h2><p>Semua nilai di bawah menjadi structured input untuk Scene Planner Affiliate Pro.</p><div className="field-section"><h3>Character</h3><div className="control-grid"><label>Nama<input value={settings.character.name} onChange={e => update("character", { name: e.target.value })} placeholder="Nama karakter" /></label><label>Berat (kg)<input inputMode="decimal" value={settings.character.weightKg} onChange={e => update("character", { weightKg: e.target.value })} placeholder="50" /></label><label>Body Type<select value={settings.character.bodyType} onChange={e => update("character", { bodyType: e.target.value as AffiliateSettings["character"]["bodyType"] })}>{BODY_TYPES.map(x => <option key={x}>{x}</option>)}</select></label></div><div className="control-grid"><label>Custom Clothing<textarea value={settings.character.customClothing} onChange={e => update("character", { customClothing: e.target.value })} placeholder="Kosongkan jika mengikuti reference." /></label><label>Custom Accessories<textarea value={settings.character.customAccessories} onChange={e => update("character", { customAccessories: e.target.value })} placeholder="Kosongkan jika mengikuti reference." /></label></div></div><div className="field-section"><h3>Video Style</h3><div className="option-grid">{AFFILIATE_VIDEO_STYLES.map(x => <button type="button" className={selected(settings.story.videoStyle === x)} key={x} onClick={() => update("story", { videoStyle: x })}>{x}</button>)}</div><div className="intent-row"><span>Content Intent</span><div className="option-grid compact">{CONTENT_INTENTS.map(x => <button type="button" className={selected(settings.story.contentIntent === x)} key={x} onClick={() => update("story", { contentIntent: x })}>{x}</button>)}</div></div></div><div className="field-section"><h3>Product</h3><div className="control-grid"><label>Product Name<input value={settings.product.name} onChange={e => { update("product", { name: e.target.value }); setDescriptionState("idle"); }} placeholder="Contoh: Tas ..." /></label><label>Product Category<select value={settings.product.category} onChange={e => { update("product", { category: e.target.value as AffiliateSettings["product"]["category"] }); setDescriptionState("idle"); }}>{PRODUCT_CATEGORIES.map(x => <option key={x}>{x}</option>)}</select></label></div><div className="ai-description"><div><b>AI Auto Description</b><button type="button" onClick={generateDescription} disabled={!settings.product.name.trim() || !productDNA || descriptionState === "generating"}>{descriptionState === "generating" ? "Analyzing…" : "Generate Description"}</button></div><textarea value={settings.product.autoDescription} onChange={e => update("product", { autoDescription: e.target.value })} placeholder="Description berbasis Product Reference DNA akan muncul di sini." />{descriptionState === "failed" && <small className="reference-error">{descriptionError}</small>}{descriptionClaims.length > 0 && <small>Observed: {descriptionClaims.join(" · ")}</small>}</div></div><div className="field-section"><h3>3. Detailed Video Parameters</h3><div className="control-grid"><label>Scene Count<select value={settings.video.sceneCount} onChange={e => update("video", { sceneCount: Number(e.target.value) })}>{[4,5,6,7,8,9,10].map(x => <option key={x}>{x}</option>)}</select></label><label>Duration<select value={settings.video.durationSeconds} onChange={e => update("video", { durationSeconds: Number(e.target.value) as AffiliateSettings["video"]["durationSeconds"] })}>{DURATIONS.map(x => <option key={x}>{x}s</option>)}</select></label><label>Aspect Ratio<select value={settings.video.aspectRatio} onChange={e => update("video", { aspectRatio: e.target.value as AffiliateSettings["video"]["aspectRatio"] })}>{ASPECT_RATIOS.map(x => <option key={x}>{x}</option>)}</select></label></div><div className="control-grid"><label>Dialog<select value={settings.video.dialogEnabled ? "On" : "Off"} onChange={e => update("video", { dialogEnabled: e.target.value === "On" })}><option>On</option><option>Off</option></select></label><label>Dialog Language<select value={settings.video.dialogLanguage} onChange={e => update("video", { dialogLanguage: e.target.value as AffiliateSettings["video"]["dialogLanguage"] })}>{DIALOG_LANGUAGES.map(x => <option key={x}>{x}</option>)}</select></label><label>Camera Type<select value={settings.video.cameraType} onChange={e => update("video", { cameraType: e.target.value as AffiliateSettings["video"]["cameraType"] })}>{CAMERA_TYPES.map(x => <option key={x}>{x}</option>)}</select></label></div><div className="control-grid"><label>Shot Type<select value={settings.video.shotType} onChange={e => update("video", { shotType: e.target.value as AffiliateSettings["video"]["shotType"] })}>{SHOT_TYPES.map(x => <option key={x}>{x}</option>)}</select></label><label>Camera Movement<select value={settings.video.cameraMovement} onChange={e => update("video", { cameraMovement: e.target.value as AffiliateSettings["video"]["cameraMovement"] })}>{CAMERA_MOVEMENTS.map(x => <option key={x}>{x}</option>)}</select></label><label>Lighting<select value={settings.video.lighting} onChange={e => update("video", { lighting: e.target.value as AffiliateSettings["video"]["lighting"] })}>{LIGHTING.map(x => <option key={x}>{x}</option>)}</select></label></div><div className="control-grid"><label>FPS<select value={settings.video.fps} onChange={e => update("video", { fps: Number(e.target.value) as AffiliateSettings["video"]["fps"] })}>{FPS_OPTIONS.map(x => <option key={x}>{x}</option>)}</select></label><label>Resolution<select value={settings.video.resolution} onChange={e => update("video", { resolution: e.target.value as AffiliateSettings["video"]["resolution"] })}>{RESOLUTIONS.map(x => <option key={x}>{x}</option>)}</select></label><label>Focus<select value={settings.video.focusMode} onChange={e => update("video", { focusMode: e.target.value as AffiliateSettings["video"]["focusMode"] })}>{FOCUS_MODES.map(x => <option key={x}>{x}</option>)}</select></label></div><div className="control-grid"><label>Stabilization<select value={settings.video.stabilization} onChange={e => update("video", { stabilization: e.target.value as AffiliateSettings["video"]["stabilization"] })}>{STABILIZATION.map(x => <option key={x}>{x}</option>)}</select></label><label>Total Duration<input readOnly value={`${totalDuration}s`} /></label><label>Pipeline Status<input readOnly value={generation === "planning" ? "Scene Planner…" : generation === "rendering" ? "Rendering scenes…" : generation === "ready" ? "Ready" : generation === "failed" ? "Failed" : "Ready to generate"} /></label></div></div><button className="generate-aqu-button" type="button" onClick={buildScenes} disabled={!canGenerate}>{generation === "planning" ? "PLANNING SCENES…" : generation === "rendering" ? "RENDERING SCENES…" : "GENERATE AQU"}</button>{generationError && <div className="reference-error">{generationError}</div>}</div></section><section className="output-column panel"><div className="output-head"><div><h2>4. Storyboard / Output</h2><p>Setiap scene dirender menjadi satu gambar utuh berdasarkan Reference DNA.</p></div><div className="output-tabs"><button className={tab === "storyboard" ? "selected" : ""} onClick={() => setTab("storyboard")}>Storyboard</button><button className={tab === "prompt" ? "selected" : ""} onClick={() => setTab("prompt")}>Final Prompt</button></div></div>{scenes.length === 0 ? <div className="empty-output"><b>Belum ada storyboard.</b><span>Upload Product Reference + isi Product Name, lalu tekan GENERATE AQU.</span></div> : <div className="scene-output-list">{scenes.map((scene, i) => <article className={`scene-output ${activeScene === i ? "active" : ""}`} key={scene.sceneNumber} onClick={() => setActiveScene(i)}><div className="scene-output-head"><div><b>Scene {String(scene.sceneNumber).padStart(2, "0")} · {scene.title}</b><span>{scene.objective}</span></div><span>{scene.durationSeconds}s</span></div>{tab === "storyboard" ? <><div className="scene-image-wrap">{scene.imageUrl ? <img src={scene.imageUrl} alt={`Scene ${scene.sceneNumber}`} /> : <div className="scene-image-placeholder">{scene.imageStatus === "generating" ? "GENERATING SCENE IMAGE…" : "WAITING"}</div>}</div><div className="scene-actions"><button type="button" onClick={e => { e.stopPropagation(); saveImage(scene); }} disabled={!scene.imageUrl}>Save Image</button><button type="button" onClick={e => { e.stopPropagation(); void regenerateImage(i); }} disabled={scene.imageStatus === "generating"}>{scene.imageStatus === "generating" ? "Regenerating Image…" : "Regenerate Image"}</button></div><div className="scene-meta"><b>Action</b><p>{scene.action}</p><b>Camera</b><p>{scene.camera}</p><b>Dialogue</b><p>{scene.dialogue || "—"}</p></div></> : <div className="prompt-box"><textarea readOnly value={scene.prompt || (scene.promptStatus === "generating" ? "Compiling Final Prompt…" : "Final Prompt belum tersedia.")} /><div className="scene-actions"><button type="button" onClick={e => { e.stopPropagation(); savePrompt(scene); }} disabled={!scene.prompt}>Save Prompt</button><button type="button" onClick={e => { e.stopPropagation(); void copyPrompt(scene); }} disabled={!scene.prompt}>Copy</button><button type="button" onClick={e => { e.stopPropagation(); void regeneratePrompt(i); }} disabled={scene.promptStatus === "generating"}>{scene.promptStatus === "generating" ? "Regenerating Prompt…" : "Regenerate Prompt"}</button></div></div>}{scene.error && <div className="reference-error">{scene.error}</div>}</article>)}</div>}</section></div></section></main>;
}
