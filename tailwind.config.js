/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // ← activation du mode sombre avec une classe CSS
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
