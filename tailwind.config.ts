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
          navy: "#0F172A", // Used for dark text now instead of backgrounds
          dark: "#F1F5F9", // Used for subtle light backgrounds
          panel: "#FFFFFF", // Used for white cards/panels
          border: "#E2E8F0", // Light subtle borders
          accent: "#F0B429", // Keeping gold
          gold: "#F0B429",
          blue: "#3B82F6", // Modern crisp blue
          muted: "#64748B", // Muted slate text
          text: "#0F172A", // Dark slate text
        },
      },
    },
  },
  plugins: [],
};
export default config;
