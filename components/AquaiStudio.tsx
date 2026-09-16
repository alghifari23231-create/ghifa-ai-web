"use client";

import { ChangeEvent, DragEvent, useMemo, useState } from "react";
import type { ModuleKey } from "../app/page";

type ReferenceAsset = {
  id: string;
  name: string;
  size: number;
  type: string;
  previewUrl: string;
  status: "uploaded" | "failed";
  error?: string;
};

const meta: Record<ModuleKey, { title: string; description: string; refs: string[]; story: string[] }> = {
  affiliate: { title: "Affiliate Pro", description: "Buat storyboard dan prompt video dari reference kamu.", refs: ["Character Reference", "Product Reference", "Background Reference"], story: ["Storytelling", "Product Review", "POV Experience", "GRWM", "Unboxing", "Before & After", "Daily Lifestyle", "Comparison", "Problem → Solution", "Tutorial / How-To", "Reaction", "Recommendation", "Lainnya"] },
  podcast: { title: "Podcast Studio", description: "Bangun scene podcast dan interview dengan continuity konsisten.", refs: ["Character 01 Reference", "Character 02 Reference", "Background Reference"], story: ["Solo Podcast", "Duo Podcast", "Trio Podcast", "Interview", "Discussion", "Storytelling", "Lainnya"] },
  vlog: { title: "Vlog Studio", description: "Rancang vlog, travel, dan lifestyle dengan visual konsisten.", refs: ["Character Reference", "Activity / Object Reference", "Background Reference"], story: ["Daily Life", "Travel", "Lifestyle", "Storytelling", "BTS", "Experience", "Before & After", "Lainnya"] },
  cinematic: { title: "Cinematic Cinema", description: "Susun sequence film dengan camera, blocking, lighting, dan continuity.", refs: ["Character Reference", "Object Reference", "Environment Reference"], story: ["Storytelling", "Drama", "Action", "Romance", "Thriller", "Adventure", "Before & After", "Lainnya"] },
  cartoon: { title: "Cartoon Animasi", description: "Bangun karakter, environment, scene plan, dan prompt animasi.", refs: ["Character Reference", "Object Reference", "Environment Reference"], story: ["Storytelling", "Comedy", "Adventure", "Fantasy", "Kids", "Before & After", "Lainnya"] },
};

const scenes = [["01", "Hook", "0–8s"], ["02", "Discovery", "8–16s"], ["03", "Interaction", "16–24s"], ["04", "Demonstration", "24–32s"], ["05", "Reaction", "32–40s"], ["06", "Closing", "40–48s"], ["07", "Detail", "48–56s"], ["08", "CTA", "56–64s"]];
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function formatSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function AquaiStudio({ moduleKey, onBack }: { moduleKey: ModuleKey; onBack: () => void }) {
  const m = meta[moduleKey];
  const [count, setCount] = useState("6");
  const [duration, setDuration] = useState("8 detik");
  const [ratio, setRatio] = useState("9:16");
  const [language, setLanguage] = useState("Indonesia");
  const [camera, setCamera] = useState("Automatic");
  const [active, setActive] = useState(0);
  const [dialog, setDialog] = useState(true);
  const [tab, setTab] = useState<"storyboard" | "prompt">("storyboard");
  const [dragging, setDragging] = useState<string | null>(null);
  const [references, setReferences] = useState<Record<string, ReferenceAsset | null>>({});
  const visible = useMemo(() => scenes.slice(0, Number(count)), [count]);
  const current = visible[Math.min(active, visible.length - 1)] || scenes[0];
  const uploadedCount = Object.values(references).filter(Boolean).length;

  const addReference = (role: string, file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setReferences((prev) => ({ ...prev, [role]: { id: `${role}-error`, name: file.name, size: file.size, type: file.type, previewUrl: "", status: "failed", error: "Format harus JPG, PNG, atau WEBP." } }));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setReferences((prev) => ({ ...prev, [role]: { id: `${role}-error`, name: file.name, size: file.size, type: file.type, previewUrl: "", status: "failed", error: "Ukuran maksimum 15 MB." } }));
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setReferences((prev) => {
      const old = prev[role];
      if (old?.previewUrl) URL.revokeObjectURL(old.previewUrl);
      return { ...prev, [role]: { id: `${role}-${crypto.randomUUID()}`, name: file.name, size: file.size, type: file.type, previewUrl, status: "uploaded" } };
    });
  };

  const onFileChange = (role: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) addReference(role, file);
    event.target.value = "";
  };

  const onDrop = (role: string, event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(null);
    const file = event.dataTransfer.files?.[0];
    if (file) addReference(role, file);
  };

  const removeReference = (role: string) => {
    setReferences((prev) => {
      const next = { ...prev };
      const old = next[role];
      if (old?.previewUrl) URL.revokeObjectURL(old.previewUrl);
      delete next[role];
      return next;
    });
  };

  return (
    <main className="studio-shell">
      <aside className="studio-sidebar">
        <button className="side-brand" onClick={onBack}><span className="brand-orbit">◉</span><span><b>AQU.AI</b><small>CREATIVE STUDIO</small></span></button>
        <nav><button onClick={onBack}>⌂ <span>Dashboard</span></button><button className="active">✦ <span>{m.title}</span></button><button>▣ <span>Projects</span></button><button>▧ <span>Assets</span></button><button>⚙ <span>Settings</span></button></nav>
        <div className="side-card"><b>AQU.AI</b><p>Reference adalah visual ground truth. Semua scene mengikuti identity yang terkunci.</p><div className="wave">∿∿∿</div></div>
      </aside>

      <section className="studio-main">
        <header className="studio-topbar"><button className="back-link" onClick={onBack}>← Semua Studio</button><span>Reference-first AI creative workflow</span><div>Tyas　⌄</div></header>
        <div className="studio-titlebar"><div className="studio-icon">◉</div><div><h1>{m.title}</h1><p>{m.description}</p></div><div className="stepper">{["References", "Story", "Scenes", "Storyboard", "Final Prompt"].map((x, i) => <div className={i === 0 ? "step current" : "step"} key={x}><span>{i + 1}</span>{x}</div>)}</div></div>

        <div className="studio-grid">
          <section className="workspace-column">
            <div className="panel">
              <div className="section-heading"><div><h2>1. References</h2><p>Upload reference asli. Asset ini menjadi visual ground truth untuk pipeline AI.</p></div><span className="upload-count">{uploadedCount}/{m.refs.length} Uploaded</span></div>
              <div className="reference-grid">
                {m.refs.map((role) => {
                  const asset = references[role];
                  return <div className="reference-card" key={role}>
                    <div className="reference-card-head"><b>{role}</b><span className={asset?.status === "uploaded" ? "status-ok" : asset?.status === "failed" ? "status-error" : "status-wait"}>{asset?.status === "uploaded" ? "Uploaded ✓" : asset?.status === "failed" ? "Failed" : "Waiting"}</span></div>
                    {asset?.previewUrl ? <div className="reference-preview"><img src={asset.previewUrl} alt={`${role} preview`} /><div className="preview-overlay"><span>{formatSize(asset.size)}</span><button type="button" onClick={() => removeReference(role)}>Remove</button></div></div> : <div className={`upload-zone ${dragging === role ? "dragging" : ""}`} onDragOver={(e) => { e.preventDefault(); setDragging(role); }} onDragLeave={() => setDragging(null)} onDrop={(e) => onDrop(role, e)}><input id={`upload-${role}`} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onFileChange(role, e)} /><label htmlFor={`upload-${role}`}><strong>＋</strong><span>{dragging === role ? "Drop image here" : "Upload reference"}</span><small>JPG · PNG · WEBP · max 15 MB</small></label></div>}
                    {asset?.status === "failed" ? <div className="reference-error">{asset.error}</div> : <div className="reference-file">{asset ? <><b>{asset.name}</b><span>{formatSize(asset.size)} · Ready for Vision Analysis</span></> : "Belum ada file"}</div>}
                    <div className="reference-actions">{asset?.status === "uploaded" && <span className="ground-truth-badge">● Ground Truth Input</span>}{asset && <label className="replace-button" htmlFor={`replace-${role}`}>Replace<input id={`replace-${role}`} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onFileChange(role, e)} /></label>}</div>
                  </div>;
                })}
              </div>
              <div className="reference-engine-note"><span>◈</span><div><b>Reference Upload Engine aktif</b><p>File diproses di browser Chrome sebagai asset referensi. Belum dianggap hasil analisis AI sampai Vision Analysis benar-benar dijalankan.</p></div></div>
            </div>

            <div className="panel"><h2>2. Story</h2><p>Pilih gaya konten. Detail cerita menjadi input Scene Planner.</p><div className="option-grid">{m.story.map((x, i) => <button className={i === 0 ? "selected" : ""} key={x}>{x}</button>)}</div><div className="intent-row"><span>Content Intent</span><div className="option-grid compact">{["Curious", "Interested", "Relatable", "Impressed", "Want to try"].map((x, i) => <button className={i === 2 ? "selected" : ""} key={x}>{x}</button>)}</div></div></div>

            <div className="panel"><h2>3. Video Settings</h2><div className="control-grid"><label>Jumlah Scene<select value={count} onChange={e => setCount(e.target.value)}><option>4</option><option>5</option><option>6</option><option>7</option><option>8</option></select></label><label>Durasi per Scene<select value={duration} onChange={e => setDuration(e.target.value)}><option>6 detik</option><option>8 detik</option><option>10 detik</option><option>15 detik</option><option>30 detik</option></select></label><label>Aspect Ratio<select value={ratio} onChange={e => setRatio(e.target.value)}><option>9:16</option><option>16:9</option><option>1:1</option></select></label><label>Dialog Language<select value={language} onChange={e => setLanguage(e.target.value)}><option>Indonesia</option><option>English</option><option>Japanese</option></select></label><label>Camera Type<select value={camera} onChange={e => setCamera(e.target.value)}><option>Automatic</option><option>Handheld</option><option>Tripod</option><option>Gimbal</option><option>Dolly</option><option>Crane</option><option>Drone</option><option>Static</option></select></label></div><div className="toggle-row"><span>Dialog</span><button className={dialog ? "toggle on" : "toggle"} onClick={() => setDialog(!dialog)}><i /></button></div><button className="generate-main" disabled={uploadedCount === 0}>✦ GENERATE AQU</button>{uploadedCount === 0 && <small className="generate-hint">Upload minimal 1 reference sebelum generation.</small>}</div>
          </section>

          <section className="scene-column"><div className="panel scene-plan-panel"><div className="panel-heading"><div><h2>Scene Plan</h2><p>Satu scene = satu frame storyboard yang utuh.</p></div><span className="scene-count">{visible.length} scenes</span></div><div className="scene-list">{visible.map((s, i) => <button key={s[0]} className={active === i ? "scene-row scene-active" : "scene-row"} onClick={() => setActive(i)}><div className={`scene-preview pv-${i % 6}`}><span>{s[0]}</span></div><div className="scene-copy"><b>{s[0]} — {s[1]}</b><small>{s[2]}</small><p>Scene dirancang dari reference, story, camera, dan continuity.</p></div><span>⋮</span></button>)}</div></div></section>

          <aside className="right-column"><div className="panel storyboard-panel"><div className="panel-heading"><div><h2>{tab === "storyboard" ? "Storyboard" : "Final Video Prompt"}</h2><p>{tab === "storyboard" ? "Output image per-scene. Tidak menampilkan ulang foto reference." : "Prompt final per scene berdasarkan reference DNA."}</p></div><span className="ready">● READY</span></div><div className="right-tabs"><button className={tab === "storyboard" ? "active" : ""} onClick={() => setTab("storyboard")}>Storyboard</button><button className={tab === "prompt" ? "active" : ""} onClick={() => setTab("prompt")}>Final Prompt</button></div>{tab === "storyboard" ? <><div className={`storyboard-frame ratio-${ratio.replace(":", "-")}`}><div className={`rendered-scene render-${active % 6}`}><span className="render-badge">SCENE {current[0]}</span><div className="render-subject">STORYBOARD<br />FRAME</div><span className="render-note">Output image generation asli per scene akan tampil di sini.</span></div><div className="preview-caption"><b>{current[0]} · {current[1]}</b><span>{duration}</span></div></div><div className="storyboard-strip">{visible.map((s, i) => <button key={s[0]} className={active === i ? "film-active" : ""} onClick={() => setActive(i)}><span>{s[0]}</span></button>)}</div><div className="storyboard-meta"><span>Scene {current[0]} of {visible.length}</span><span>{ratio} · {camera}</span></div></> : <div className="prompt-view"><div><b>@Character</b><p>Identity mengikuti Character DNA dan Identity Lock.</p></div><div><b>@Product</b><p>Detail mengikuti product reference yang benar-benar terlihat.</p></div><div><b>@Background</b><p>Environment mengikuti background reference dan continuity.</p></div><div><b>Scene {current[0]}</b><p>{current[1]}. {duration}. {ratio}. Camera {camera}. {dialog ? `Dialog ${language}.` : "Tanpa dialog."}</p></div><button className="copy-button">Copy Final Prompt</button></div>}</div></aside>
        </div>
      </section>
    </main>
  );
}
