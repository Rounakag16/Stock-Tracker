import colors from "tailwindcss/colors";

// "Ledger Blue" palette:
//   ink #0F172A · paper #F8FAFC · line #E2E8F0 · brand = blue (600 #2563EB) · accent = amber
//
// Blue is only for interaction and emphasis (buttons, links, active nav,
// focus). Stock actions each own one colour — see ACTION_TONES in
// src/components/ui.jsx: green added, orange sale, violet moved,
// amber adjusted/pending, red danger.

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: colors.blue,
        accent: colors.amber,
        ink: "#0F172A",
        paper: "#F8FAFC",
        line: "#E2E8F0",
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      keyframes: {
        riseIn: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "none" },
        },
        floatTag: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "rise-in": "riseIn 0.7s cubic-bezier(0.16,1,0.3,1) both",
        "float-tag": "floatTag 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
