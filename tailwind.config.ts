import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#0A1E31", 700: "#13293F", 600: "#1D3A54", 400: "#4A6B8A" },
        ink: "#0A1E31",
        green: { DEFAULT: "#00B553", dark: "#007A38", light: "#E6F8EE" },
        paper: "#F7F8F9",
        line: "#E3E7EB",
        muted: "#6B7A8C",
      },
      fontFamily: {
        display: ["Archivo", "system-ui", "sans-serif"],
        sans: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: { xl2: "1.25rem" },
    },
  },
  plugins: [],
};
export default config;
