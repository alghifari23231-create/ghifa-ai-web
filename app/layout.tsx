import type { Metadata } from "next";
import "./globals.css";
import "./affiliate.css";

export const metadata: Metadata = {
  title: "AQU.AI — Creative Tools Directory",
  description: "AI Video Prompt & Visual Scene Production Studio",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
