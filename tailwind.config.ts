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
        primary: "#FFB3C6",
        secondary: "#BDE0FE",
        accent: "#FFCF56",
        bgSoft: "#FFF7F0",
        // New theme colors for tiles
        tile: {
          pink: "#FFE4EC",
          blue: "#E8F4FD",
          yellow: "#FFF8E1",
          green: "#E8F5E9",
        }
      },
      borderRadius: {
        "2xl": "1.5rem",
        "3xl": "1.75rem"
      }
    }
  },
  plugins: []
};

export default config;
