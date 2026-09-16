"use client";

import { useMemo, useState } from "react";
import type { ModuleKey } from "../app/page";

const moduleMeta: Record<ModuleKey, { title: string; description: string; contentLabel: string; refs: string[] }> = {
  affiliate: { title: "Affiliate Studio", description: "Buat storyboard dan prompt video dari referensi kamu.", contentLabel: "Content Intent", refs: ["Character Reference", "Product Reference", "Background Reference"] },
  podcast: { title: "Podcast Studio", description: "Bangun scene podcast dan interview dari referensi kamu.", contentLabel: "Podcast Format", refs: ["Character 01 Reference", "Character 02 Reference", "Background Reference"] },
  vlog: { title: "Vlog Studio", description: "Rancang vlog, travel, dan lifestyle dengan visual konsisten.", contentLabel: "Vlog Intent", refs: ["Character Reference", "Object / Activity Reference", "Background Reference"] },
  cinematic: { title: "Cinematic Cinema", description: "Susun sequence film dengan camera, blocking, lighting, dan continuity.", contentLabel: "Cinematic Direction", refs: ["Character Reference", "Object Reference", "Background Reference"] },
  cartoon: { title: "Cartoon Animasi", description: "Bangun karakter animasi dan scene produksi dari referensi.", contentLabel: "Animation Style", refs: ["Character Reference", "Object Reference", "Environment Reference"] },
};

const scenes = [
  ["01", "Hook", "0–8s", "Karakter membuka cerita dengan visual pembuka yang langsung terhubung ke referensi."],
  ["02", "Discovery", "8–16s", "Kamera berpindah secara natural untuk memperlihatkan detail penting scene."],
  ["03", "Interaction", "16–24s", "Karakter berinteraksi dengan objek sesuai fungsi dan physics dunia nyata."],
  ["04", "Demonstration", "24–32s", "Aksi utama diperlihatkan dengan blocking dan camera movement yang jelas."],
  ["05", "Reaction", "32–40s", "Ekspresi dan respons karakter tetap konsisten dengan identity lock."],
  ["06", "CTA", "40–48s", "Penutup terasa natural dan tidak mengubah identitas visual."],
];

export function AquaiStudio({ moduleKey, onBack }: { moduleKey: ModuleKey; onBack: () => void }) {
  const meta = moduleMeta[moduleKey];
  const [sceneCount, setSceneCount] = useState("6");
  const [duration, setDuration] = useState("8 detik");
  const [ratio, setRatio] = useState("9:16");
  const [language, setLanguage] = useState("Indonesia");
  const [camera, setCamera] = useState("Automatic");
  const [activeScene, setActiveScene] = useState(0);
  const [dialog, setDialog] = useState(true);

  const visibleScenes = useMemo(() => scenes.slice(0, Number(sceneCount)), [sceneCount]);

  return (
    <main className="studio-shell">
      <aside className="studio-sidebar">
        <button className="side-brand" onClick={onBack}><span className="brand-orbit">◉</span><span><b>AQU.AI</b><small>CREATIVE STUDIO</small></span></button>
        <nav>
          <button onClick={onBack}>⌂ <span>Dashboard</span></button>
          <button className="active">♧ <span>{meta.title}</span><em>NEW</em></button>
          <button>▣ <span>Projects</span></button>
          <button>▧ <span>Assets</span></button>
          <button>⚙ <span>Settings</span></button>
        </nav>
        <div className="side-card"><b>AQU.AI</b><p>Ubah referensi visual menjadi cerita video yang realistis dan siap dijalankan di AI.</p><div className="wave">∿∿∿</div></div>
      </aside>

      <section className="studio-main">
        <header className="studio-topbar"><span>Turn Real References Into <b>Realistic AI Stories</b></span><div>♧　Tyas　⌄</div></header>

        <div className="studio-titlebar">
          <div className="studio-icon">◉</div>
          <div><h1>{meta.title}</h1><p>{meta.description}</p></div>
          <div className="stepper">{["References", "Story", "Scenes", "Storyboard", "Final Prompts"].map((x, i) => <div key={x} className={i === 0 ? "step current" : "step"}><span>{i + 1}</span>{x}</div>)}</div>
        </div>

        <div className="studio-grid">
          <section className="left-column">
            <div className="panel references-panel">
              <h2>1. References</h2><p>Unggah referensi sesuai peran. Foto referensi menjadi visual ground truth.</p>
              {meta.refs.map((ref, i) => <div className="reference-row" key={ref}><div className={`ref-thumb ref-${i}`}><span>+</span></div><div><b>{ref}</b><small>Upload visual reference</small></div><button>Edit</button></div>)}
              <div className="analysis-box"><div><b>Reference Analysis</b><span>Ready for Vision</span></div>{meta.refs.map((ref) => <div className="analysis-line" key={ref}><span>✓　{ref.replace(" Reference", "")}</span><strong>—</strong></div>)}</div>
            </div>

            <div className="panel story-panel">
              <h2>2. Story</h2><p>Pilih arah konten dan atur tujuan cerita.</p>
              <div className="option-grid">{(moduleKey === "affiliate" ? ["Product Review", "POV Experience", "GRWM", "Daily Lifestyle", "Unboxing", "Lainnya"] : moduleKey === "podcast" ? ["Solo Podcast", "Duo Podcast", "Trio Podcast", "Interview", "Discussion", "Lainnya"] : ["Daily Life", "Travel", "Lifestyle", "Story", "BTS", "Lainnya"]).map((x, i) => <button className={i === 0 ? "selected" : ""} key={x}>{x}</button>)}</div>
              <label>{meta.contentLabel}</label>
              <div className="option-grid compact">{["Curious", "Interested", "Relatable", "Impressed", "Want to try"].map((x, i) => <button className={i === 2 ? "selected" : ""} key={x}>{x}</button>)}</div>
            </div>
          </section>

          <section className="center-column">
            <div className="panel controls-panel">
              <h2>3. Scenes & Storyboard</h2>
              <div className="control-grid"><label>Jumlah Scene<select value={sceneCount} onChange={e => setSceneCount(e.target.value)}><option>4</option><option>5</option><option>6</option><option>8</option></select></label><label>Durasi per Scene<select value={duration} onChange={e => setDuration(e.target.value)}><option>8 detik</option><option>10 detik</option><option>12 detik</option></select></label><label>Aspect Ratio<select value={ratio} onChange={e => setRatio(e.target.value)}><option>9:16</option><option>16:9</option><option>1:1</option></select></label><label>Bahasa Dialog<select value={language} onChange={e => setLanguage(e.target.value)}><option>Indonesia</option><option>English</option><option>Japanese</option></select></label><label>Camera<select value={camera} onChange={e => setCamera(e.target.value)}><option>Automatic</option><option>Handheld</option><option>Tripod</option><option>Gimbal</option><option>Dolly</option><option>Crane</option><option>Drone</option><option>Static</option></select></label></div>
              <div className="toggle-row"><span>Dialog</span><button className={dialog ? "toggle on" : "toggle"} onClick={() => setDialog(!dialog)}><i /></button></div>
              <button className="generate-plan">✦ Generate Scene Plan</button>
            </div>

            <div className="panel scene-list-panel"><div className="scene-list-head"><h2>Scene Plan</h2><span>{visibleScenes.length} scenes</span></div>{visibleScenes.map((s, i) => <button key={s[0]} className={`scene-row ${activeScene === i ? "scene-active" : ""}`} onClick={() => setActiveScene(i)}><div className={`scene-preview pv-${i}`}><span>{s[0]}</span></div><div className="scene-copy"><b>{s[0]} — {s[1]}</b><small>{s[2]}</small><p>{s[3]}</p></div><span>⋮</span></button>)}</div>
            <button className="generate-main">✦ GENERATE AQU</button>
          </section>

          <aside className="right-column">
            <div className="panel storyboard-panel"><div className="panel-heading"><h2>Storyboard Preview</h2><span className="ready">● AI READY</span></div><div className="hero-preview"><div className="mock-person">AQU.AI</div><div className="preview-caption">Scene {String(activeScene + 1).padStart(2, "0")} • {visibleScenes[activeScene]?.[1] ?? "Hook"}<span>{duration}</span></div></div><div className="filmstrip">{visibleScenes.map((s, i) => <button onClick={() => setActiveScene(i)} className={activeScene === i ? "film-active" : ""} key={s[0]}>{s[0]}</button>)}</div></div>
            <div className="panel prompt-panel"><div className="panel-heading"><h2>Final Video Prompt</h2><button>Copy Prompt</button></div><div className="prompt-block"><b>♧ @Character</b><p>Wanita sesuai referensi, identitas wajah, kulit, body, hijab, rambut, outfit dan detail fisik terkunci. Tidak boleh berubah antar scene.</p><b>▣ @Product</b><p>Objek mengikuti referensi secara presisi: bentuk, material, warna, label, skala, detail dan fungsi.</p><b>⌂ @Background</b><p>Environment mengikuti referensi: ruang, furniture, layout, pencahayaan, perspektif dan atmosphere.</p><p>Scene bergerak secara natural dengan anatomi manusia realistis, physics dunia nyata, camera movement profesional, crisp detail, tanpa morphing, tanpa identity drift, tanpa perubahan wardrobe atau background.</p><p>{dialog ? `Dialog menggunakan ${language} dengan gaya percakapan natural.` : "Tanpa dialog."}</p></div><div className="prompt-actions"><button>▣ Copy Prompt</button><button>⇩ Export</button></div></div>
          </aside>
        </div>
      </section>
    </main>
  );
}
