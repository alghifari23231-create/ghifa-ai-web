import type { Metadata } from "next";
import "./globals.css";
import "./affiliate.css";
import "./dashboard.css";

export const metadata: Metadata = {
  title: "Kllapromp Engine Pro — AI Creative Workspace",
  description: "AI-powered video prompt and visual scene production workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
