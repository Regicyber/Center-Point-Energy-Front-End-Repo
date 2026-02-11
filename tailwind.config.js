/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#003366',     // Dark Navy Blue (CenterPoint brand)
        secondary: '#FF8C00',   // Orange (CenterPoint accent)
        accent: '#0066CC',      // Bright Blue
      },
    },
  },
  plugins: [],
};
