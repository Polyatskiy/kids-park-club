import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./ui/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--kp-background))",
        foreground: "hsl(var(--kp-foreground))",
        surface: "hsl(var(--kp-surface))",
        "surface-muted": "hsl(var(--kp-surface-muted))",
        border: "hsl(var(--kp-border))",
        input: "hsl(var(--kp-input))",
        primary: {
          DEFAULT: "hsl(var(--kp-primary))",
          foreground: "hsl(var(--kp-primary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--kp-accent))",
          foreground: "hsl(var(--kp-accent-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--kp-muted))",
          foreground: "hsl(var(--kp-muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--kp-destructive))",
          foreground: "hsl(var(--kp-destructive-foreground))",
        },
        ring: "hsl(var(--kp-ring))",
        card: {
          DEFAULT: "hsl(var(--kp-card))",
          foreground: "hsl(var(--kp-card-foreground))",
        },
        // Tile helper colors (used in some content)
        tile: {
          pink: "var(--color-tile-pink)",
          blue: "var(--color-tile-blue)",
          yellow: "var(--color-tile-yellow)",
          green: "var(--color-tile-green)",
        },
      },
      borderRadius: {
        lg: "var(--kp-radius-lg)",
        xl: "var(--kp-radius-xl)",
        "2xl": "var(--kp-radius-2xl)",
      },
      boxShadow: {
        "soft": "var(--kp-shadow-soft)",
        "strong": "var(--kp-shadow-strong)",
      },
      fontFamily: {
        sans: ["system-ui", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
    }
  },
  plugins: []
};

export default config;
