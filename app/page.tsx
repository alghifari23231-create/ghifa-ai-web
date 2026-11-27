"use client";

import { useState } from "react";
import { AffiliateStudio } from "../components/AffiliateStudio";
import { AquaiStudio } from "../components/AquaiStudio";
import { HomeDashboard } from "../components/HomeDashboard";

export type ModuleKey = "affiliate" | "podcast" | "vlog" | "cinematic" | "cartoon";

export default function Home() {
  const [selected, setSelected] = useState<ModuleKey | null>(null);

  if (selected === "affiliate") return <AffiliateStudio onBack={() => setSelected(null)} />;
  if (selected) return <AquaiStudio moduleKey={selected} onBack={() => setSelected(null)} />;

  return <HomeDashboard onSelect={setSelected} />;
}
