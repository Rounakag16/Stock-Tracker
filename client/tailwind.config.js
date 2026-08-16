/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        ink: "#142018",
        paper: "#F4F6F3",
        rust: {
          50: "#FDF4E9",
          100: "#FBE8CE",
          400: "#F0AC5C",
          500: "#E8963B",
          600: "#CC7A22",
          700: "#A8611A",
        },
        line: "#DCE3DA",
      },
      fontFamily: {
        display: ['"Archivo"', "sans-serif"],
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      keyframes: {
        riseIn: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "none" },
        },
        floatTag: {
          "0%, 100%": { transform: "rotate(-3deg) translateY(0)" },
          "50%": { transform: "rotate(-3deg) translateY(-8px)" },
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
