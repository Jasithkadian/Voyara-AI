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
        primary: '#0A84FF',
        coral: '#FF6F61',
        warmWhite: '#FAFAF8',
        stoneMuted: '#E8E6E1',
        textPrimary: '#1A1A2E',
        textSecondary: '#6B7280',
        successSage: '#2D6A4F',
        warningAmber: '#D97706',

        // ─── Dark mode semantic tokens ───
        // Use these instead of raw neutral-* shades:
        //   dark:bg-dark-bg  dark:bg-dark-card  dark:text-dark-text
        dark: {
          DEFAULT: '#1A1A2E',
          bg: '#0a0a0c',            // page background (was neutral-950)
          card: '#141416',          // card surfaces (was neutral-900)
          elevated: '#1c1c1e',      // elevated surfaces, modals
          muted: '#262626',         // muted backgrounds (was neutral-800)
          border: '#2d2d30',        // borders (was neutral-800)
          text: '#f5f5f5',          // primary text (was neutral-50)
          'text-muted': '#a1a1aa',  // secondary text (was neutral-400)
        },
      },
      fontFamily: {
        display: ['"PP Neue Montreal"', '"Neue Montreal"', 'sans-serif'],
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      fontWeight: {
        normal: '400',
        semibold: '600',
      },
      fontSize: {
        'xs': ['12px', '16px'],
        'sm': ['14px', '20px'],
        'base': ['16px', '24px'],
        'lg': ['20px', '28px'],
        'xl': ['28px', '36px'],
        '2xl': ['40px', '48px'],
        '3xl': ['56px', '68px'],
        '4xl': ['72px', '84px'],
      },
      spacing: {
        'hairline': '4px',
        'tight': '8px',
        'comfortable': '16px',
        'generous': '24px',
        'spacious': '48px',
        'dramatic': '80px',
      },
      borderRadius: {
        'sm': '4px',      // inputs
        'md': '8px',      // cards
        'lg': '12px',     // large cards
      },
      boxShadow: {
        'card-hover': '0 2px 8px rgba(0,0,0,0.08)',
      }
    },
  },
  plugins: [],
}
