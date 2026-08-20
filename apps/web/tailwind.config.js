/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f0f11',
        surface: '#18181b',
        primary: '#8b5cf6', // Electric violet
        accent: '#06b6d4',  // Subtle cyan
      }
    },
  },
  plugins: [],
}