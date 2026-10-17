/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // semantic tokens (index.css)
        bg: v('bg'),
        panel: v('panel'),
        raised: v('raised'),
        fg: v('fg'),
        fg2: v('fg2'),
        fg3: v('fg3'),
        accent: v('accent'),
        line: 'var(--line)',
        line2: 'var(--line2)',
        // legacy scales remapped to the new palette
        slate: {
          50: '#f7f7f8', 100: '#efeff1', 200: '#e3e3e6', 300: '#cfcfd4', 400: '#a1a1aa', 500: '#7c7c85',
          600: '#5c5c64', 700: '#3f3f46', 800: '#26262b', 900: '#18181b', 950: '#0d0d0f',
        },
        brand: {
          50: '#eef0ff', 100: '#e0e3ff', 200: '#c5cbff', 300: '#a2aafc', 400: '#7d86f8',
          500: '#5560f4', 600: '#4450e0', 700: '#3741bd', 800: '#2f3799', 900: '#2a317a',
        },
      },
      letterSpacing: { tightest: '-0.03em' },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        blink: { '50%': { opacity: 0 } },
        fill: { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
      },
      animation: { 'fade-in': 'fade-in .2s ease-out', blink: 'blink 1s step-end infinite' },
    },
  },
  plugins: [],
}
