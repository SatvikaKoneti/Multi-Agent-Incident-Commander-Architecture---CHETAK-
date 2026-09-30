/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        ink: {
          950: '#060a13',
          900: '#0a101f',
          850: '#0d1424',
          800: '#111a2e',
          700: '#1a2540',
        },
        accent: {
          DEFAULT: '#22d3ee',
          soft: '#67e8f9',
          dim: '#155e75',
        },
        ghmc: {
          amber: '#f5b301',
          teal: '#14b8a6',
          violet: '#a78bfa',
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease both',
        'fade-in': 'fadeIn 0.35s ease both',
        'pulse-ring': 'pulseRing 2.2s cubic-bezier(0.4,0,0.6,1) infinite',
        shimmer: 'shimmer 1.6s linear infinite',
        'spin-slow': 'spin 2.4s linear infinite',
        'float-slow': 'floatSlow 7s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(34,211,238,0.45)' },
          '70%': { boxShadow: '0 0 0 10px rgba(34,211,238,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(34,211,238,0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        floatSlow: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(34,211,238,0.12), 0 8px 30px -12px rgba(34,211,238,0.25)',
        panel: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 10px 34px -18px rgba(0,0,0,0.7)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(to right, rgba(56,189,248,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(56,189,248,0.05) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid-sm': '44px 44px',
      },
    },
  },
  plugins: [],
};