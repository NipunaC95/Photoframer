/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          dark: '#0d0f12',
          card: '#15181e',
          elevated: '#1c2027',
          sidebar: '#111317',
          subtle: '#222731',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-hover': 'rgba(255, 255, 255, 0.16)',
        },
        brand: {
          50: '#ecfeff',
          100: '#cffafe',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Inter',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          '"Fira Code"',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        'surface-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.25)',
        'surface-md': '0 4px 12px 0 rgba(0, 0, 0, 0.35)',
        'surface-lg': '0 12px 32px 0 rgba(0, 0, 0, 0.45)',
        'glow-cyan': '0 0 20px -3px rgba(6, 182, 212, 0.35)',
      }
    },
  },
  plugins: [],
}
