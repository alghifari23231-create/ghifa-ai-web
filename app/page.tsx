"use client";

import { useState } from "react";
import { AffiliateStudio } from "../components/AffiliateStudio";
import { AquaiStudio } from "../components/AquaiStudio";

export type ModuleKey = "affiliate" | "podcast" | "vlog" | "cinematic" | "cartoon";

export const modules: { key: ModuleKey; number: string; title: string; subtitle: string; description: string; icon: string }[] = [
  { key: "affiliate", number: "01", title: "Affiliate Pro", subtitle: "Product Story", description: "Buat cerita affiliate, storyboard, dan prompt video dari reference visual.", icon: "✦" },
  { key: "podcast", number: "02", title: "Podcast", subtitle: "Studio & Interview", description: "Bangun podcast solo, duo, atau trio dengan continuity karakter dan dialog.", icon: "◉" },
  { key: "vlog", number: "03", title: "Vlog", subtitle: "Daily & Lifestyle", description: "Rancang vlog, travel, lifestyle, dan aktivitas harian berbasis reference.", icon: "◫" },
  { key: "cinematic", number: "04", title: "Cinematic Cinema", subtitle: "Film & Story", description: "Susun sequence film dengan blocking, kamera, lighting, dan visual continuity.", icon: "▣" },
  { key: "cartoon", number: "05", title: "Cartoon Animasi", subtitle: "Character Animation", description: "Kembangkan karakter, environment, scene, dan prompt animasi yang konsisten.", icon: "✺" },
];

export default function Home() {
  const [selected, setSelected] = useState<ModuleKey | null>(null);

  if (selected === "affiliate") return <AffiliateStudio onBack={() => setSelected(null)} />;
  if (selected) return <AquaiStudio moduleKey={selected} onBack={() => setSelected(null)} />;

  return (
    <main className="directory-page">
      <div className="directory-brand">
        <div className="brand-orbit large">◉</div>
        <div>
          <div className="directory-title">AQU.AI</div>
          <div className="directory-subtitle">Creative Tools Directory</div>
        </div>
      </div>

      <section className="directory-intro">
        <span className="directory-kicker">AI CREATIVE STUDIO</span>
        <h1>Pilih Studio</h1>
        <p>Setiap kartu memiliki workflow sendiri. Pilih modul untuk membuka studio dan mulai membuat visual, storyboard, serta prompt.</p>
      </section>

      <section className="module-grid" aria-label="AQU.AI modules">
        {modules.map((module) => (
          <button key={module.key} className="module-card" onClick={() => setSelected(module.key)}>
            <div className="card-topline"><span>#{module.number}</span><span className="card-arrow">↗</span></div>
            <div className={`module-visual visual-${module.key}`}><span className="visual-icon">{module.icon}</span><span>OPEN STUDIO</span></div>
            <div className="module-copy">
              <div className="module-title-row"><h2>{module.title}</h2><span className="heart">♡</span></div>
              <div className="module-subtitle">{module.subtitle}</div>
              <p>{module.description}</p>
            </div>
            <div className="access-button">Akses Studio <span>→</span></div>
          </button>
        ))}
      </section>

      <div className="directory-note">AQU.AI · Reference-first creative workflow</div>
    </main>
  );
}
