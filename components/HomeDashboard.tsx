"use client";

import type { ReactNode } from "react";

type DashboardModuleKey = "affiliate" | "podcast" | "vlog" | "cinematic" | "cartoon";

type Props = {
  onSelect: (key: DashboardModuleKey) => void;
};

const modules: {
  key: DashboardModuleKey | null;
  number: string;
  title: string;
  description: string;
  icon: string;
  status: "live" | "soon";
  accent: string;
}[] = [
  { key: "affiliate", number: "01", title: "Affiliate Pro", description: "Product storytelling, scene planning, dan prompt video.", icon: "✦", status: "live", accent: "violet" },
  { key: "podcast", number: "02", title: "Podcast Studio", description: "Bangun format solo, interview, duo, hingga panel.", icon: "◉", status: "live", accent: "blue" },
  { key: "vlog", number: "03", title: "Vlog Creator", description: "Daily life, travel, lifestyle, dan creator diary.", icon: "▣", status: "live", accent: "cyan" },
  { key: "cinematic", number: "04", title: "Film Drama", description: "Rancang adegan sinematik dengan continuity visual.", icon: "▤", status: "live", accent: "rose" },
  { key: "cartoon", number: "05", title: "Cartoon Animation", description: "Kembangkan karakter dan dunia animasi yang konsisten.", icon: "✺", status: "live", accent: "amber" },
  { key: null, number: "06", title: "Edukasi & Tutorial", description: "Konten edukasi, explainer, dan video instruksional.", icon: "⌘", status: "soon", accent: "blue" },
  { key: null, number: "07", title: "Storytelling", description: "Cerita pendek, narasi, dan visual berbasis alur.", icon: "❝", status: "soon", accent: "violet" },
  { key: null, number: "08", title: "Live Streaming", description: "Rancang rundown, segmen, dan interaksi live.", icon: "◍", status: "soon", accent: "rose" },
  { key: null, number: "09", title: "Dokumenter", description: "Reportase, profil subjek, dan cerita faktual.", icon: "▧", status: "soon", accent: "cyan" },
  { key: null, number: "10", title: "Corporate Profile", description: "Video brand, company profile, dan komunikasi bisnis.", icon: "◇", status: "soon", accent: "amber" },
];

function Glyph({ children }: { children: ReactNode }) {
  return <span aria-hidden="true" className="dash-glyph">{children}</span>;
}

export function HomeDashboard({ onSelect }: Props) {
  const activeModules = modules.filter((module) => module.status === "live").length;

  return (
    <main className="command-dashboard">
      <aside className="command-sidebar">
        <div className="command-brand">
          <div className="command-brand-mark"><span>✦</span></div>
          <div><strong>KLLAPROMP</strong><small>ENGINE PRO</small></div>
        </div>

        <div className="sidebar-caption">WORKSPACE</div>
        <nav className="command-nav" aria-label="Main navigation">
          <button className="command-nav-item active"><Glyph>⌂</Glyph><span>Home Dashboard</span><i>•</i></button>
          <button className="command-nav-item"><Glyph>▦</Glyph><span>Production Studio</span></button>
          <button className="command-nav-item"><Glyph>◈</Glyph><span>Asset Library</span></button>
          <button className="command-nav-item"><Glyph>▤</Glyph><span>My Projects</span><span className="nav-count">03</span></button>
          <button className="command-nav-item"><Glyph>◷</Glyph><span>Prompt History</span></button>
        </nav>

        <div className="sidebar-caption sidebar-caption-tools">MANAGEMENT</div>
        <nav className="command-nav">
          <button className="command-nav-item"><Glyph>⚙</Glyph><span>Settings</span></button>
          <button className="command-nav-item"><Glyph>♧</Glyph><span>Admin Panel</span><span className="admin-lock">↗</span></button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-plan">
            <div className="plan-icon">✧</div>
            <div><b>Creator Workspace</b><small>AI production environment</small></div>
            <span className="plan-dots">•••</span>
          </div>
          <div className="sidebar-user">
            <div className="user-avatar">K</div>
            <div><b>Creator Account</b><small>Workspace member</small></div>
            <span className="user-menu">⌄</span>
          </div>
        </div>
      </aside>

      <section className="command-main">
        <header className="command-topbar">
          <div className="breadcrumb"><span>Workspace</span><b>/</b><strong>Home</strong></div>
          <div className="topbar-actions">
            <div className="engine-indicator"><span className="pulse-dot" /> Engine ready</div>
            <button className="top-icon" aria-label="Search">⌕</button>
            <button className="top-icon notification-button" aria-label="Notifications">♧<i /></button>
            <div className="top-avatar">K</div>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow"><span /> YOUR CREATIVE COMMAND CENTER</div>
              <h1>Selamat datang di ruang<br /><em>kreasi tanpa batas.</em></h1>
              <p>Semua workflow produksi AI Anda, terhubung dalam satu workspace.</p>
            </div>
            <button className="primary-create" onClick={() => onSelect("affiliate")}><span>＋</span> Create New Project <b>↗</b></button>
          </section>

          <section className="overview-grid" aria-label="Workspace overview">
            <article className="overview-card overview-highlight">
              <div className="overview-card-top"><span>MODULES AVAILABLE</span><span className="overview-symbol">✦</span></div>
              <div className="overview-value">{String(activeModules).padStart(2, "0")}<small> / 10</small></div>
              <div className="overview-foot"><span className="mini-bar"><i style={{ width: "50%" }} /></span><span>5 modules active</span></div>
            </article>
            <article className="overview-card">
              <div className="overview-card-top"><span>YOUR PROJECTS</span><span className="overview-symbol">▤</span></div>
              <div className="overview-value">03</div>
              <div className="overview-foot"><span className="status-pill status-neutral">Workspace overview</span></div>
            </article>
            <article className="overview-card">
              <div className="overview-card-top"><span>AI ENGINE</span><span className="overview-symbol">⌘</span></div>
              <div className="overview-value engine-value">Ready</div>
              <div className="overview-foot"><span className="status-pill status-live"><i /> System operational</span></div>
            </article>
          </section>

          <section className="announcement-panel">
            <div className="announcement-art"><div className="announcement-orbit orbit-one" /><div className="announcement-orbit orbit-two" /><div className="announcement-core">✦</div><span className="art-spark spark-one">✧</span><span className="art-spark spark-two">✦</span></div>
            <div className="announcement-copy">
              <div className="announcement-label"><span className="announcement-live-dot" /> ANNOUNCEMENT CENTER <span className="announcement-new">NEW UPDATE</span></div>
              <h2>Semua kabar penting,<br />langsung dari pusat kendali.</h2>
              <p>Update engine, jadwal maintenance, tips prompt, dan informasi lisensi akan ditampilkan di sini.</p>
              <div className="announcement-meta"><span>✦</span> Dikelola melalui Admin Panel <b>·</b> <span>Update feed</span></div>
            </div>
            <button className="announcement-arrow" aria-label="Open announcement">↗</button>
          </section>

          <section className="module-section">
            <div className="section-head">
              <div><div className="section-eyebrow">YOUR TOOLKIT</div><h2>Production Modules <span>10</span></h2><p>Pilih workflow yang paling sesuai dengan ide konten Anda.</p></div>
              <button className="text-action">View all modules <b>→</b></button>
            </div>
            <div className="dashboard-module-grid">
              {modules.map((module) => (
                <button
                  key={module.number}
                  className={`dashboard-module-card accent-${module.accent} ${module.status === "soon" ? "module-coming" : ""}`}
                  onClick={() => module.key && onSelect(module.key)}
                  disabled={module.status === "soon"}
                  aria-label={module.status === "live" ? `Open ${module.title}` : `${module.title}, coming soon`}
                >
                  <div className="module-card-head"><span className="module-number">{module.number}</span><span className={module.status === "live" ? "module-status" : "module-status coming"}>{module.status === "live" ? "AVAILABLE" : "COMING SOON"}</span></div>
                  <div className="module-icon-wrap"><Glyph>{module.icon}</Glyph><span className="module-open">↗</span></div>
                  <div className="module-card-copy"><h3>{module.title}</h3><p>{module.description}</p></div>
                </button>
              ))}
            </div>
          </section>

          <section className="lower-dashboard-grid">
            <article className="recent-panel">
              <div className="section-head compact-head"><div><div className="section-eyebrow">CONTINUE CREATING</div><h2>Recent Projects</h2></div><button className="text-action">All projects <b>→</b></button></div>
              <div className="empty-project-state"><div className="empty-project-icon">▤</div><div><b>Your next idea starts here</b><p>Project yang Anda kerjakan akan muncul di area ini.</p></div><button onClick={() => onSelect("affiliate")}>Start a project <span>↗</span></button></div>
            </article>
            <article className="system-panel">
              <div className="section-eyebrow">SYSTEM OVERVIEW</div><h2>Engine Status</h2>
              <div className="system-row"><span className="system-row-icon">✦</span><div><b>Core Workspace</b><small>Interface & navigation</small></div><span className="system-ok">Operational</span></div>
              <div className="system-row"><span className="system-row-icon">◈</span><div><b>Reference Intelligence</b><small>Visual reference processing</small></div><span className="system-ok">Operational</span></div>
              <div className="system-row"><span className="system-row-icon">⌘</span><div><b>Gemini Connection</b><small>Generation services</small></div><span className="system-check">Check in studio</span></div>
            </article>
          </section>
          <footer className="dashboard-footer"><span>KLLAPROMP ENGINE PRO <b>·</b> CREATIVE WORKSPACE</span><span>Built for creators who think beyond templates.</span></footer>
        </div>
      </section>
    </main>
  );
}
