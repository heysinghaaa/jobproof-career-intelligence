import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobProof | Explainable Career Intelligence",
  description:
    "Build job-specific proof packets with explainable matching, scam signals, project evidence, and optional user-owned AI enhancement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
