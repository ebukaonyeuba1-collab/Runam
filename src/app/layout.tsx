import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RunAm",
  description: "Errands, run by someone already going that way.",
};

export const viewport: Viewport = {
  themeColor: "#0A1E31",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@112,500;112,700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="mx-auto min-h-screen w-full max-w-md bg-white shadow-[0_0_60px_rgba(10,30,49,0.08)]">
          {children}
        </div>
      </body>
    </html>
  );
}
