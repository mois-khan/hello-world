import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: "#0A2E5C",
          blue: "#1B4B8C",
          "blue-dark": "#0D3B6E",
          "blue-light": "#E8F0FA",
          saffron: "#FF9933",
          green: "#138808",
          grey: "#F4F6F9",
          border: "#D0D7E2",
          text: "#1A1A2E",
          muted: "#5A6B7D",
        },
        surface: {
          light: "#F4F6F9",
          card: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        hindi: ["var(--font-noto)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "8px",
        btn: "4px",
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease-out forwards",
        "fade-in": "fadeIn 0.4s ease-out forwards",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
