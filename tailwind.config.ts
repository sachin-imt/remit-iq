import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/content/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#0A1628",
          dark: "#0D1B2E",
          panel: "#111D32",
          border: "#1E3A5F",
          accent: "#F0B429",
          gold: "#F0B429",
          blue: "#00B9FF",
          muted: "#7A9CC4",
          text: "#C8D8E8",
        },
      },
    },
  },
  plugins: [],
};
export default config;
