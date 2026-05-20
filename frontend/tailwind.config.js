/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f6f3eb",
        "paper-2": "#ede8d9",
        card: "#fffdf7",
        "card-edge": "#e8e2d0",
        ink: {
          DEFAULT: "#1a1640",
          2: "#3b375f",
          3: "#6b6788",
          4: "#9b97b3",
          5: "#c5c1d4",
        },
        green: {
          DEFAULT: "#0f7a4f",
          deep: "#0a5a3a",
          soft: "#128c5b",
        },
        mint: {
          DEFAULT: "#4ee8a3",
        },
      },
      fontFamily: {
        sans: ["Geist", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        serif: ["Newsreader", "Source Serif 4", "Georgia", "serif"],
        mono: ["Geist Mono", "ui-monospace", "SF Mono", "Menlo", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "20px",
      },
      boxShadow: {
        1: "0 1px 0 rgba(26,22,64,0.04), 0 1px 2px rgba(26,22,64,0.04)",
        2: "0 1px 0 rgba(26,22,64,0.04), 0 4px 14px rgba(26,22,64,0.06)",
        3: "0 10px 40px -10px rgba(26,22,64,0.16)",
      },
    },
  },
  plugins: [],
};
