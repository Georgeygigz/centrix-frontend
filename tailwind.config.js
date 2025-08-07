/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
        'elegant': ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        'modern': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 