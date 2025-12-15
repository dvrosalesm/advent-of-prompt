import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        cursor: {
          bg: "#0a0a0f",
          "bg-secondary": "#18181b",
          "bg-tertiary": "#27272a",
          border: "#3f3f46",
          text: "#e4e4e7",
          "text-muted": "#a1a1aa",
          accent: "#71717a",
          "accent-hover": "#a1a1aa",
          success: "#22c55e",
          error: "#ef4444",
        },
        christmas: {
          red: "#D42426",
          green: "#165B33",
          gold: "#F8B229",
          cream: "#F0EAD6",
          dark: "#0F172A",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
        display: ["var(--font-mountains)"],
      },
      animation: {
        "snow": "snow 10s linear infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "shimmer": "shimmer 1.5s infinite",
      },
      keyframes: {
        snow: {
          "0%": { transform: "translateY(-10px)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(168, 85, 247, 0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(168, 85, 247, 0.5)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  darkMode: 'class',
} satisfies Config;
