/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f8ff',
          100: '#e1f0ff',
          200: '#bce1ff',
          300: '#82c7ff',
          400: '#40a6ff',
          500: '#0a84ff', // Premium Blue
          600: '#0061d5',
          700: '#004aa6',
          800: '#003e8c',
          900: '#003373',
          DEFAULT: '#0a84ff'
        },
        accent: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e', // Airbnb-like Rose
          600: '#e11d48',
          700: '#be123c',
          DEFAULT: '#f43f5e'
        },
        dark: {
          50: '#a3a3a3',
          100: '#737373',
          200: '#525252',
          300: '#404040',
          400: '#262626',
          500: '#171717',
          600: '#0a0a0a',
          DEFAULT: '#171717'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}
