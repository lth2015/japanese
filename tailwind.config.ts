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
        // Surfaces
        bg: "var(--bg)",
        "bg-subtle": "var(--bg-subtle)",
        "bg-muted": "var(--bg-muted)",
        surface: "var(--surface)",

        // Borders
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        "border-input": "var(--border-input)",

        // Foreground
        fg: {
          DEFAULT: "var(--fg)",
          secondary: "var(--fg-secondary)",
          tertiary: "var(--fg-tertiary)",
          "on-accent": "var(--fg-on-accent)",
        },

        // Brand / state
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          soft: "var(--accent-soft)",
          fg: "var(--fg-on-accent)",
        },
        success: {
          DEFAULT: "var(--success)",
          soft: "var(--success-soft)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          soft: "var(--warning-soft)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          soft: "var(--danger-soft)",
        },
        vermilion: "var(--vermilion)",

        // shadcn semantic aliases (so shadcn snippets work without surgery)
        background: "var(--bg)",
        foreground: "var(--fg)",
        card: {
          DEFAULT: "var(--surface)",
          foreground: "var(--fg)",
        },
        popover: {
          DEFAULT: "var(--surface-elevated)",
          foreground: "var(--fg)",
        },
        primary: {
          DEFAULT: "var(--accent)",
          foreground: "var(--fg-on-accent)",
        },
        secondary: {
          DEFAULT: "var(--bg-subtle)",
          foreground: "var(--fg)",
        },
        muted: {
          DEFAULT: "var(--bg-subtle)",
          foreground: "var(--fg-secondary)",
        },
        destructive: {
          DEFAULT: "var(--danger)",
          foreground: "var(--fg-on-accent)",
        },
        input: "var(--border-input)",
        ring: "var(--accent)",
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "10px",
        xl: "14px",
        "2xl": "20px",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        focus: "var(--shadow-focus)",
      },
      fontFamily: {
        sans: ["Inter", '"Noto Sans SC"', '"Noto Sans JP"', "system-ui", "sans-serif"],
        jp: ['"Noto Sans JP"', '"Noto Sans SC"', "Inter", "system-ui", "sans-serif"],
        "jp-serif": ['"Noto Serif JP"', '"Noto Serif SC"', "Georgia", "serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        // Calibrated per design-system v2: body 16/18, section 24-32, hero up to 48
        xs: ["0.75rem", { lineHeight: "1.5" }], // 12
        sm: ["0.875rem", { lineHeight: "1.5" }], // 14
        base: ["1rem", { lineHeight: "1.65" }], // 16
        lg: ["1.125rem", { lineHeight: "1.65" }], // 18
        xl: ["1.25rem", { lineHeight: "1.45" }], // 20
        "2xl": ["1.5rem", { lineHeight: "1.35" }], // 24
        "3xl": ["1.875rem", { lineHeight: "1.25" }], // 30
        "4xl": ["2.25rem", { lineHeight: "1.2" }], // 36
        "5xl": ["3rem", { lineHeight: "1.15" }], // 48
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
          "0%, 100%": {
            transform: "scale(1)",
            boxShadow: "0 0 0 0 rgba(192, 57, 43, 0.35)",
          },
          "50%": {
            transform: "scale(1.04)",
            boxShadow: "0 0 0 12px rgba(192, 57, 43, 0)",
          },
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
