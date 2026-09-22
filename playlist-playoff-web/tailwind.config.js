/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // True electric blue, hue locked to ~227-231deg with the red channel
        // kept near zero. The old indigo family (hue ~238-250deg, red >= green)
        // read as blue on wide-gamut/unmanaged monitors but as violet on
        // color-managed screens (iPhone, Mac, Safari). Authoring the hue this
        // far from violet means it stays blue everywhere.
        // Keep in sync with: GhostFibers defaults, PageBackground, app/layout.jsx
        // (Clerk colorPrimary), components/ui/Glow.jsx, and the rgba(18,64,234,…)
        // shadows in BracketTree / BracketHeader.
        brand: {
          DEFAULT: '#1240EA',
          light: '#7C9CFF',
          deep: '#0A1A6B',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // Ambient loops run as CSS keyframes (compositor thread, zero JS per
      // frame) instead of Framer Motion `repeat: Infinity` — they keep running
      // smoothly while the main thread is busy hydrating or loading embeds.
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '0.65' },
          '50%': { opacity: '0.95' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        nudge: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(6px)' },
        },
        shimmer: {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        float: 'float 4s ease-in-out infinite',
        nudge: 'nudge 1.8s ease-in-out infinite',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
