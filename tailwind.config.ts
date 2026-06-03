import type { Config } from 'tailwindcss';

/**
 * Glook Tailwind config.
 *
 * Tailwind v4 handles the live theme via @theme in globals.css.
 * This file exists for shadcn/ui CLI compatibility and documents
 * the full design token set.
 */
const config: Config = {
  darkMode: 'class',

  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],

  theme: {
    extend: {
      colors: {
        bg: {
          primary:   '#0E0E0F',
          secondary: '#161618',
          tertiary:  '#1E1E21',
          elevated:  '#232328',
        },
        severity: {
          critical: '#FF4444',
          high:     '#FF8C42',
          medium:   '#F5C518',
          low:      '#4A9EFF',
          pass:     '#3DDC84',
        },
        accent: {
          DEFAULT: '#6E56CF',
          hover:   '#7C68D4',
        },
        border: {
          subtle:  'rgba(255,255,255,0.06)',
          default: 'rgba(255,255,255,0.10)',
          strong:  'rgba(255,255,255,0.18)',
        },
        text: {
          primary:   '#F1F0EE',
          secondary: '#8B8A85',
          tertiary:  '#5A5955',
          code:      '#E8C77D',
        },
        // shadcn/ui semantic tokens
        background:  '#0E0E0F',
        foreground:  '#F1F0EE',
        card: {
          DEFAULT:    '#161618',
          foreground: '#F1F0EE',
        },
        popover: {
          DEFAULT:    '#1E1E21',
          foreground: '#F1F0EE',
        },
        primary: {
          DEFAULT:    '#6E56CF',
          foreground: '#F1F0EE',
        },
        secondary: {
          DEFAULT:    '#1E1E21',
          foreground: '#8B8A85',
        },
        muted: {
          DEFAULT:    '#161618',
          foreground: '#8B8A85',
        },
        destructive: {
          DEFAULT:    '#FF4444',
          foreground: '#F1F0EE',
        },
        input:  'rgba(255,255,255,0.10)',
        ring:   '#6E56CF',
      },

      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'monospace'],
      },

      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },

      keyframes: {
        scoreIn: {
          from: { opacity: '0', transform: 'scale(0.8)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        cardFadeUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },

      animation: {
        'score-in':    'scoreIn 400ms ease-out',
        'card-fade-up': 'cardFadeUp 300ms ease-out both',
      },
    },
  },

  plugins: [],
};

export default config;
