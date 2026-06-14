/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: "#080C12",
        card: "#111820",
        border: "#1C2635",
        hover: "#16212F",
        success: "#00E5A0",
        danger: "#FF4D6A",
        primary: "#00D4FF",
      },
    },
  },
  plugins: [],
}
