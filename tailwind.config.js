/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          50: "#faf8f3",
          100: "#f5f0e6",
          200: "#ebe3ce",
          300: "#dfd1ab",
          400: "#d4bf88",
          500: "#c9ad65",
          600: "#b69142",
          700: "#8f7133",
          800: "#685224",
          900: "#413316",
        },
        secondary: {
          500: "#1a1a1a",
          600: "#141414",
          700: "#0a0a0a",
        },
        gold: {
          light: "#dfd1ab",
          DEFAULT: "#c9ad65",
          dark: "#b69142",
        },
      },
      fontFamily: {
        sans: ["Poppins", "system-ui", "sans-serif"],
        heading: ["Poppins", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
