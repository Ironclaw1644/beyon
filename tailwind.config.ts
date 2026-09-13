import type { Config } from 'tailwindcss';

// Brand tokens are named by role, not hue, so a palette change never needs a
// class rename. Text contrast (AA) on white/cream:
//   primary 6.4:1, primary-dark 8.4:1, ink 17:1, muted 7.6:1.
//   accent (sage) is 2.4:1 — decorative fills and borders only, never text.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#A8392A',
          'primary-dark': '#8A2E22',
          accent: '#9DAA8C',
          ink: '#1F1A17',
          cream: '#F7F2EA',
          muted: '#5B524C'
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif']
      },
      boxShadow: {
        card: '0 10px 30px rgba(31,26,23,0.07)',
        'card-hover': '0 16px 36px rgba(31,26,23,0.11)'
      },
      borderRadius: {
        xl2: '1.25rem'
      }
    }
  },
  plugins: []
};

export default config;
