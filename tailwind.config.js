/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0a0b0f',
          soft: '#0f1117',
          card: '#14161e',
          elevated: '#181b24',
          border: '#1f232e',
          'border-strong': '#2a2f3c',
        },
        fg: {
          DEFAULT: '#e6e8ee',
          muted: '#8a91a3',
          dim: '#5b6275',
          faint: '#3a4050',
        },
        accent: {
          DEFAULT: '#6e8bff',
          hover: '#8aa3ff',
          soft: 'rgba(110,139,255,0.12)',
          ring: 'rgba(110,139,255,0.35)',
        },
        success: '#22c55e',
        warn: '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'JetBrains Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)',
        elevated: '0 10px 40px -10px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
        focus: '0 0 0 3px rgba(110,139,255,0.25)',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: '0', transform: 'translateX(20px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        'fade-in': 'fadeIn 150ms ease-out',
        'slide-up': 'slideUp 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 250ms cubic-bezier(0.16, 1, 0.3, 1)',
        shimmer: 'shimmer 1.8s linear infinite',
      },
    },
  },
  plugins: [],
};
