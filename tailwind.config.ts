import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0B1220",
          50: "#F4F6F8",
          100: "#E3E8EC",
          400: "#5A6B7D",
          600: "#2E3D4E",
          800: "#141D2B",
          900: "#0B1220",
        },
        emerald: {
          DEFAULT: "#0F9D74",
          50: "#E9FBF4",
          100: "#CBF5E4",
          400: "#2AB98A",
          500: "#0F9D74",
          600: "#0C7D5D",
          700: "#095E46",
        },
        amber: {
          DEFAULT: "#E8A33D",
          100: "#FBE9CB",
          400: "#EDB35C",
          500: "#E8A33D",
          600: "#C4832A",
        },
        mint: {
          DEFAULT: "#B8F1DE",
          100: "#DFFAF0",
        },
        cloud: {
          DEFAULT: "#F5F8F7",
          100: "#FFFFFF",
        },
        danger: {
          DEFAULT: "#E0574C",
          100: "#FBE0DD",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-body)", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(11, 18, 32, 0.28)",
        "glass-sm": "0 4px 16px 0 rgba(11, 18, 32, 0.18)",
        "glow-emerald": "0 0 0 1px rgba(15,157,116,0.35), 0 8px 24px -4px rgba(15,157,116,0.35)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      animation: {
        "mesh-drift": "mesh-drift 22s ease-in-out infinite alternate",
        "fade-up": "fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
      keyframes: {
        "mesh-drift": {
          "0%": { transform: "translate(0%, 0%) scale(1)" },
          "100%": { transform: "translate(-4%, 3%) scale(1.08)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
