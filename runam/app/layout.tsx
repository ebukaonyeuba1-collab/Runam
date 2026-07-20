import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "RunAm — Your errands. Done by trusted people.",
  description:
    "RunAm connects you with trusted runners who help you complete everyday errands quickly, securely, and affordably.",
  openGraph: {
    title: "RunAm",
    description: "Your errands. Done by trusted people.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
