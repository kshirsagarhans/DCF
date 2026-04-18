import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgBase: 'var(--bg-base)',
        bgSurface: 'var(--bg-surface)',
        bgSurface2: 'var(--bg-surface-2)',
        bgSurface3: 'var(--bg-surface-3)',
        primary: 'var(--accent-primary)',
        secondary: 'var(--accent-secondary)',
        amber: 'var(--accent-amber)',
        coral: 'var(--accent-coral)',
        violet: 'var(--accent-violet)',
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        textTertiary: 'var(--text-tertiary)',
        textInverse: 'var(--text-inverse)',
        borderSubtle: 'var(--border-subtle)',
        borderDefault: 'var(--border-default)',
        borderStrong: 'var(--border-strong)',
        positive: 'var(--positive)',
        negative: 'var(--negative)',
        neutral: 'var(--neutral)',
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '14px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px var(--border-subtle)',
      },
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        '150': '150ms',
        '250': '250ms',
        '400': '400ms',
      }
    },
  },
  plugins: [],
} satisfies Config
