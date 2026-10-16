/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        brand: {
          50: '#eef4ff', 100: '#dbe6ff', 200: '#bfd3ff', 300: '#93b4ff', 400: '#608aff',
          500: '#3b63fb', 600: '#2544f0', 700: '#1d33dc', 800: '#1e2bb2', 900: '#1f2b8c',
        },
        accent: { 400: '#22d3ee', 500: '#06b6d4' },
      },
      keyframes: {
        'fade-in': { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'none' } },
        blink: { '50%': { opacity: 0 } },
      },
      animation: { 'fade-in': 'fade-in .25s ease-out', blink: 'blink 1s step-end infinite' },
    },
  },
  plugins: [],
}
