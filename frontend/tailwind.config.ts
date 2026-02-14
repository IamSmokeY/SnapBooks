import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Glassmorphism Dark Theme Colors
      colors: {
        background: '#050505',
        foreground: '#ffffff',
        card: {
          DEFAULT: 'rgba(20, 20, 23, 0.6)',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        primary: {
          DEFAULT: '#0071e3',
          50: '#e6f3ff',
          100: '#cce7ff',
          200: '#99cfff',
          300: '#66b7ff',
          400: '#339fff',
          500: '#0071e3',
          600: '#005bb6',
          700: '#004489',
          800: '#002e5c',
          900: '#00172e',
        },
        success: {
          DEFAULT: '#10b981',
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        warning: {
          DEFAULT: '#f59e0b',
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        error: {
          DEFAULT: '#f43f5e',
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#f43f5e',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        accent: {
          DEFAULT: '#8b5cf6',
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
      },
      // Premium Typography
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      // 8px Spacing Grid
      spacing: {
        '0.5': '4px',   // 0.5 × 8px
        '1': '8px',     // 1 × 8px
        '1.5': '12px',  // 1.5 × 8px
        '2': '16px',    // 2 × 8px
        '2.5': '20px',  // 2.5 × 8px
        '3': '24px',    // 3 × 8px
        '3.5': '28px',  // 3.5 × 8px
        '4': '32px',    // 4 × 8px
        '5': '40px',    // 5 × 8px
        '6': '48px',    // 6 × 8px
        '7': '56px',    // 7 × 8px
        '8': '64px',    // 8 × 8px
        '9': '72px',    // 9 × 8px
        '10': '80px',   // 10 × 8px
        '11': '88px',   // 11 × 8px
        '12': '96px',   // 12 × 8px
        '14': '112px',  // 14 × 8px
        '16': '128px',  // 16 × 8px
        '20': '160px',  // 20 × 8px
        '24': '192px',  // 24 × 8px
        '28': '224px',  // 28 × 8px
        '32': '256px',  // 32 × 8px
        '36': '288px',  // 36 × 8px
        '40': '320px',  // 40 × 8px
        '44': '352px',  // 44 × 8px
        '48': '384px',  // 48 × 8px
        '52': '416px',  // 52 × 8px
        '56': '448px',  // 56 × 8px
        '60': '480px',  // 60 × 8px
        '64': '512px',  // 64 × 8px
        '72': '576px',  // 72 × 8px
        '80': '640px',  // 80 × 8px
        '96': '768px',  // 96 × 8px
      },
      // Border Radius (Apple style)
      borderRadius: {
        'none': '0',
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
        'full': '9999px',
      },
      // Glassmorphic Shadows
      boxShadow: {
        'sm': '0 2px 8px rgba(0, 0, 0, 0.3)',
        'DEFAULT': '0 4px 16px rgba(0, 0, 0, 0.4)',
        'md': '0 8px 24px rgba(0, 0, 0, 0.5)',
        'lg': '0 12px 32px rgba(0, 0, 0, 0.6)',
        'xl': '0 16px 48px rgba(0, 0, 0, 0.7)',
        '2xl': '0 24px 64px rgba(0, 0, 0, 0.8)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)',
        'none': 'none',
      },
      // Glassmorphic Backdrop Blur
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
        '3xl': '64px',
      },
      // Animation
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}

export default config
