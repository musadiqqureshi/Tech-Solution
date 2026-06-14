/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aura: {
          purple: '#7c3aed',
          violet: '#6d28d9',
          blue: '#2563eb',
          cyan: '#06b6d4',
          gold: '#f59e0b',
          ink: '#0f172a',
          mist: '#f8fafc',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'spin-slow': 'spin 14s linear infinite',
        'fade-in-up': 'fadeInUp 0.8s ease forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-18px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(124,58,237,0.18), 0 0 40px rgba(6,182,212,0.1)' },
          '50%': { boxShadow: '0 0 40px rgba(124,58,237,0.35), 0 0 80px rgba(6,182,212,0.2)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'aura-gradient': 'linear-gradient(135deg, #7c3aed 0%, #2563eb 50%, #06b6d4 100%)',
        'gold-gradient': 'linear-gradient(135deg, #f59e0b, #fbbf24)',
      },
    },
  },
  plugins: [],
}
