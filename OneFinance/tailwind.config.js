/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },
        income: {
          light: "#dcfce7",
          DEFAULT: "#22c55e",
          dark: "#15803d",
        },
        expense: {
          light: "#fee2e2",
          DEFAULT: "#ef4444",
          dark: "#b91c1c",
        },
        sidebar: {
          DEFAULT: "#1e293b",
          hover: "#334155",
          active: "#475569",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
