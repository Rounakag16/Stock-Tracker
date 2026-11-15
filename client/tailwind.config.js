import colors from "tailwindcss/colors";

// "Warm builder" palette:
//   charcoal #1C1917 (ink) · orange #F97316 (brand-500) · cream #FFF7ED (paper) · teal #14B8A6 (accent-500)
//
// Two remaps keep every existing page on-palette without touching each
// class name: the cool `slate` greys become warm `stone` greys, and the
// green `emerald` used for "success / added" states becomes teal.

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316",
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
        },
        accent: colors.teal,
        slate: colors.stone,
        emerald: colors.teal,
        ink: "#1C1917",
        paper: "#FFF7ED",
        line: "#F0E2D0",
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
