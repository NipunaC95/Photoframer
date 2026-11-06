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
        background: 'var(--bg-base)',
        foreground: 'var(--text-primary)',
        card: 'var(--bg-card)',
        'card-foreground': 'var(--text-primary)',
        panel: 'var(--bg-panel)',
        elevated: 'var(--bg-elevated)',
        border: 'var(--border-subtle)',
        'border-strong': 'var(--border-strong)',
        'muted-foreground': 'var(--text-muted)',
        peak: 'var(--brand-accent)',
        'chip-surface': 'var(--chip-surface)',
        neutral: {
          950: '#0a0a0a',
          900: '#141414',
          850: '#1a1a1a',
          800: '#262626',
          700: '#3f3f46',
          600: '#52525b',
          500: '#71717a',
          400: '#a1a1aa',
          300: '#d4d4d8',
          200: '#e4e4e7',
          100: '#f4f4f5',
          50: '#fafafa',
        },
      },
      fontFamily: {
        sans: [
          '"Geist"',
          '"Geist Variable"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"Geist Mono"',
          '"Geist Mono Variable"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },
      borderRadius: {
        'patensify': '0.875rem',
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.03em',
        tight: '-0.025em',
        normal: '0',
        wide: '0.025em',
        widest: '0.1em',
      },
      boxShadow: {
        'patensify-sm': '0 1px 3px rgba(0, 0, 0, 0.7), 0 1px 2px rgba(0, 0, 0, 0.5)',
        'patensify-md': '0 4px 8px -2px rgba(0, 0, 0, 0.7), 0 2px 4px -1px rgba(0, 0, 0, 0.5)',
        'patensify-lg': '0 12px 24px -6px rgba(0, 0, 0, 0.8), 0 4px 8px -2px rgba(0, 0, 0, 0.6)',
        'glow-ember': '0 0 24px -4px rgba(255, 107, 74, 0.25)',
      }
    },
  },
  plugins: [],
}
