/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand palette — dark shooting range aesthetic
        surface: {
          DEFAULT: "#0F0F1A",
          card: "#1A1A2E",
          elevated: "#242438",
          border: "#2E2E4A",
        },
        accent: {
          DEFAULT: "#EF4444",   // shot red
          hover: "#DC2626",
        },
        confirm: {
          DEFAULT: "#10B981",   // confirmed green
          hover: "#059669",
        },
        warn: {
          DEFAULT: "#F59E0B",   // pending amber
        },
        brand: {
          DEFAULT: "#6366F1",   // indigo
          hover: "#4F46E5",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "ping-slow": "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.25s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
