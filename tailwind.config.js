/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'sans-serif'],
      },
      colors: {
        obsidian: {
          DEFAULT: '#09090b',
          deep: '#050507',
          surface: '#121215',
          card: '#18181b',
          muted: '#27272a',
        },
        brand: {
          neon: '#10b981',
          mint: '#34d399',
          glow: 'rgba(16, 185, 129, 0.25)',
        },
      },
      boxShadow: {
        'neon-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.35)',
        'neon-sm': '0 0 15px -3px rgba(16, 185, 129, 0.25)',
        'glass-subtle': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        blob: "blob 7s infinite",
      },
      keyframes: {
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
      },
    },
  },
  plugins: [],
};
