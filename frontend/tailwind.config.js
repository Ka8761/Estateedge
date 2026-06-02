/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // EstateEdge brand palette
        ink: {
          DEFAULT: '#0D0D0F',
          50:  '#F7F7F8',
          100: '#EBEBED',
          200: '#D4D4D9',
          300: '#ADADB8',
          400: '#7E7E8E',
          500: '#5A5A6A',
          600: '#42424F',
          700: '#2E2E38',
          800: '#1C1C23',
          900: '#0D0D0F',
        },
        gold: {
          DEFAULT: '#C9A84C',
          50:  '#FDF8EC',
          100: '#F9EDD1',
          200: '#F2D99B',
          300: '#E8C165',
          400: '#C9A84C',
          500: '#A8882F',
          600: '#826920',
          700: '#5C4B17',
          800: '#382E0D',
          900: '#1A1506',
        },
        sage: {
          DEFAULT: '#4A7C59',
          50:  '#EEF5F1',
          100: '#D5E8DC',
          200: '#A9D0B8',
          300: '#7DB894',
          400: '#4A7C59',
          500: '#3A6146',
          600: '#2C4935',
          700: '#1E3224',
          800: '#111C14',
          900: '#070E09',
        },
        cream: '#FAF8F4',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        heading: ['"DM Sans"', 'system-ui', 'sans-serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
        '10xl': ['10rem', { lineHeight: '1' }],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-in-right': 'slideInRight 0.4s ease-out forwards',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201, 168, 76, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(201, 168, 76, 0)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to: { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'glow-gold': '0 0 24px rgba(201, 168, 76, 0.25)',
        'glow-sage': '0 0 24px rgba(74, 124, 89, 0.2)',
        'card': '0 1px 3px rgba(13,13,15,0.06), 0 8px 24px rgba(13,13,15,0.06)',
        'card-hover': '0 4px 12px rgba(13,13,15,0.08), 0 16px 40px rgba(13,13,15,0.1)',
      },
    },
  },
  plugins: [],
};