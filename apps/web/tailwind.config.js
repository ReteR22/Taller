/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base:    { 900: '#0A0A0A', 800: '#111111', 700: '#1A1A1A', 600: '#222222' },
        primary: { DEFAULT: '#EF4444', dark: '#DC2626', light: '#FCA5A5' },
        info:    { DEFAULT: '#3B82F6', dark: '#2563EB', light: '#93C5FD' },
        gold:    { DEFAULT: '#F59E0B', dark: '#D97706', light: '#FCD34D' },
        surface: { DEFAULT: '#141414', raised: '#1C1C1C', overlay: '#242424' },
      },
      fontFamily: {
        display: ['Bebas Neue', 'Impact', 'sans-serif'],
        body:    ['DM Sans', 'Segoe UI', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-red':   '0 0 20px rgba(239,68,68,0.3)',
        'glow-blue':  '0 0 20px rgba(59,130,246,0.3)',
        'glow-gold':  '0 0 20px rgba(245,158,11,0.3)',
        'card':       '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
}
