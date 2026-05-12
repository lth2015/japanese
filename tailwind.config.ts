import type { Config } from "tailwindcss"
import animate from "tailwindcss-animate"

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surface
        "bg-deep": "var(--bg-deep)",
        "bg-base": "var(--bg-base)",
        "bg-elevated": "var(--bg-elevated)",
        "bg-overlay": "var(--bg-overlay)",
        // Border
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        // Text
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        // Brand / state
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          glow: "var(--accent-glow)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        vermilion: "var(--vermilion)",
        // shadcn aliases
        background: "var(--bg-base)",
        foreground: "var(--text-primary)",
        card: {
          DEFAULT: "var(--bg-elevated)",
          foreground: "var(--text-primary)",
        },
        popover: {
          DEFAULT: "var(--bg-overlay)",
          foreground: "var(--text-primary)",
        },
        primary: {
          DEFAULT: "var(--accent)",
          foreground: "var(--text-primary)",
        },
        secondary: {
          DEFAULT: "var(--bg-overlay)",
          foreground: "var(--text-primary)",
        },
        muted: {
          DEFAULT: "var(--bg-overlay)",
          foreground: "var(--text-secondary)",
        },
        destructive: {
          DEFAULT: "var(--danger)",
          foreground: "var(--text-primary)",
        },
        input: "var(--border)",
        ring: "var(--accent)",
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "10px",
        lg: "14px",
        xl: "18px",
        "2xl": "24px",
      },
      fontFamily: {
        sans: ["Inter", '"Noto Sans SC"', '"Noto Sans JP"', "system-ui", "sans-serif"],
        jp: ['"Noto Sans JP"', '"Noto Sans SC"', "Inter", "system-ui", "sans-serif"],
        "jp-serif": ['"Noto Serif JP"', '"Noto Serif SC"', "Georgia", "serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        display: ["clamp(2.5rem, 6vw, 5rem)", { lineHeight: "1.15" }],
        hero: ["clamp(1.75rem, 3vw, 2.5rem)", { lineHeight: "1.2" }],
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "pulse-record": {
          "0%, 100%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(220,38,38,0.4)" },
          "50%": { transform: "scale(1.05)", boxShadow: "0 0 0 14px rgba(220,38,38,0)" },
        },
        "scale-press": {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(0.97)" },
        },
      },
      animation: {
        "fade-in": "fade-in 250ms cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-out": "fade-out 200ms ease-in",
        "pulse-record": "pulse-record 1.2s ease-in-out infinite",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [animate],
}

export default config
