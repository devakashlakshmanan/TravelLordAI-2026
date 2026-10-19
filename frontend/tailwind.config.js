/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#102A43',
          800: '#1E3A5F',
          700: '#2A4D77',
        },
        teal: {
          DEFAULT: '#147D75',
          dark: '#0E5C56',
          light: '#1B9A90',
        },
        mint: {
          DEFAULT: '#65D6AD',
          light: '#88E4C2',
          dark: '#48B890',
        },
        warmWhite: '#F7F9FC',
        slateText: '#526477',
        caution: '#B45309',
        alertRed: '#B42318',
        verifiedGreen: '#16794B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        card: '0 2px 8px -2px rgba(16, 42, 67, 0.06), 0 4px 16px -4px rgba(16, 42, 67, 0.08)',
        hover: '0 4px 14px -2px rgba(16, 42, 67, 0.1), 0 8px 24px -4px rgba(16, 42, 67, 0.12)',
      },
    },
  },
  plugins: [],
}
