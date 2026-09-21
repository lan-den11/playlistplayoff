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
        // (Clerk colorPrimary), and the rgba(18,64,234,…) shadows in
        // BracketTree / BracketHeader.
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
    },
  },
  plugins: [],
};
