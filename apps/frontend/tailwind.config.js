/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ─── Semantic tokens (CSS variables — auto-switch light/dark) ───
        background: 'var(--color-bg)',
        surface: 'var(--color-bg-surface)',
        elevated: 'var(--color-bg-elevated)',
        card: 'var(--color-bg-card)',
        foreground: 'var(--color-text)',
        'foreground-secondary': 'var(--color-text-secondary)',
        'foreground-muted': 'var(--color-text-muted)',
        'foreground-faint': 'var(--color-text-faint)',
        'border-default': 'var(--color-border)',
        'border-strong': 'var(--color-border-strong)',
        brand: 'var(--color-primary)',
        'brand-soft': 'var(--color-primary-soft)',
        'brand-muted': 'var(--color-primary-muted)',
        'brand-text': 'var(--color-primary-text)',
        success: 'var(--color-success)',
        'success-soft': 'var(--color-success-soft)',
        warn: 'var(--color-warn)',
        'warn-soft': 'var(--color-warn-soft)',
        danger: 'var(--color-danger)',
        'danger-soft': 'var(--color-danger-soft)',

        // ─── Terracotta — brand primary ───
        primary: {
          50:  '#FBEEE7',
          100: '#F4D6C5',
          200: '#E9B194',
          300: '#DD8C66',
          400: '#D17452',
          500: '#C4623F',
          600: '#A84E2E',
          700: '#7E3A22',
          800: '#5A2918',
          900: '#3D1B0F',
        },

        // ─── Clay — neutral warm browns ───
        clay: {
          50:  '#FBF6F0',
          100: '#F5EBDD',
          200: '#EAD9BF',
          300: '#D9C2A0',
          400: '#B89B78',
          500: '#8C6F52',
          600: '#65503C',
          700: '#4B3C2C',
          800: '#3A2A1F',
          900: '#261A11',
        },

        // ─── Ochre — warm yellow accent ───
        ochre: {
          100: '#FBEACB',
          300: '#EDC585',
          500: '#D89A3F',
          600: '#B57E2C',
          700: '#8A5F1F',
        },

        // ─── Olive — warm green success ───
        olive: {
          100: '#EAEED5',
          300: '#B7C282',
          500: '#8A9A4F',
          600: '#6B7A3F',
          700: '#4F5A2D',
        },

        // ─── Rust — warm red danger ───
        rust: {
          100: '#F4D6CF',
          300: '#DD7E69',
          500: '#B94632',
          600: '#A23E2C',
          700: '#7A2D20',
        },
      },

      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        mono: ['var(--font-jetbrains-mono)', 'Menlo', 'monospace'],
      },

      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },

      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
