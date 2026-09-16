"use client";

import { useState } from "react";
import { AquaiStudio } from "../components/AquaiStudio";

export type ModuleKey = "affiliate" | "podcast" | "vlog" | "cinematic" | "cartoon";

export const modules: { key: ModuleKey; number: string; title: string; subtitle: string; description: string; icon: string; active: boolean }[] = [
  { key: "affiliate", number: "01", title: "Affiliate Pro", subtitle: "AI Product Story Studio", description: "Ubah referensi karakter, produk, dan lingkungan menjadi storyboard serta prompt video yang konsisten.", icon: "✦", active: true },
  { key: "podcast", number: "02", title: "Podcast", subtitle: "Studio & Interview", description: "Bangun scene podcast dengan jumlah karakter, dialog, kamera, dan continuity yang terkontrol.", icon: "◉", active: true },
  { key: "vlog", number: "03", title: "Vlog", subtitle: "Travel & Lifestyle", description: "Rancang vlog harian dan lifestyle dengan visual sinematik yang tetap berpijak pada referensi.", icon: "◫", active: true },
  { key: "cinematic", number: "04", title: "Cinematic Cinema", subtitle: "Story & Film", description: "Susun sequence film, blocking, camera movement, lighting, dan visual continuity.", icon: "▣", active: true },
  { key: "cartoon", number: "05", title: "Cartoon Animasi", subtitle: "Character Animation", description: "Kembangkan karakter animasi, environment, scene plan, dan prompt produksi.", icon: "✺", active: true },
];

export default function Home() {
  const [selected, setSelected] = useState<ModuleKey | null>(null);

  if (selected) {
    return <AquaiStudio moduleKey={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <main className="app-shell dashboard-shell">
      <header className="dashboard-header">
        <div className="brand-mark"><span>◉</span></div>
        <div>
          <div className="brand-title">AQU.AI</div>
          <div className="brand-subtitle">Creative Tools Directory</div>
        </div>
        <div className="header-spacer" />
        <button className="ghost-button">◌ Notifications</button>
        <div className="profile-pill"><div className="avatar">T</div><span>Tyas</span><span>⌄</span></div>
      </header>

      <section className="hero">
        <div className="eyebrow">CREATIVE STUDIO SUITE</div>
        <h1>Creative Tools Directory</h1>
        <p>Koleksi tools AI untuk membangun workflow kreatif yang lebih cepat, fleksibel, konsisten, dan siap digunakan untuk kebutuhan profesional.</p>
      </section>

      <section className="module-grid" aria-label="AQU.AI modules">
        {modules.map((module) => (
          <button key={module.key} className="module-card" onClick={() => setSelected(module.key)}>
            <div className="card-topline"><span>#{module.number}</span><span className="status-dot">● Active</span></div>
            <div className={`module-visual visual-${module.key}`}><span className="visual-icon">{module.icon}</span><span className="visual-label">REFERENCE • SCENE • PROMPT</span></div>
            <div className="module-copy">
              <div className="module-title-row"><h2>{module.title}</h2><span className="heart">♡</span></div>
              <div className="module-subtitle">{module.subtitle}</div>
              <p>{module.description}</p>
            </div>
            <div className="access-button">Akses Studio <span>→</span></div>
          </button>
        ))}
      </section>

      <footer className="dashboard-footer">AQU.AI <span>•</span> Creative Tools for Smarter Content Creation</footer>
    </main>
  );
}
