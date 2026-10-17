/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Pretendard Variable"', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
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
          50: '#fff4ed', 100: '#ffe6d5', 200: '#ffc9a8', 300: '#ffa370', 400: '#ff8540',
          500: '#ff6a1a', 600: '#f2540a', 700: '#c9400a', 800: '#a0350f', 900: '#812f10',
        },
      },
      letterSpacing: { tightest: '-0.045em' },
      keyframes: {
        'fade-in': { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'none' } },
        blink: { '50%': { opacity: 0 } },
        fill: { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
      },
      animation: { 'fade-in': 'fade-in .2s ease-out', blink: 'blink 1s step-end infinite' },
    },
  },
  plugins: [],
}
