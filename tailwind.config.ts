import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        midnight: {
          bg: "#08111F",
          surface: "#0D192A",
          raised: "#122238",
          hover: "#182E4B",
          cyan: "#56D9F5",
          teal: "#39D6C0",
          mint: "#78F5CF",
          amber: "#F4BB63",
          danger: "#F87171",
          text: "#F1F5F9",
          muted: "#8E9EB5",
        },
      },
    },
  },
  plugins: [],
};

export default config;