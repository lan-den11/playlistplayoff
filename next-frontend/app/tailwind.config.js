/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // "Showdown" gradient stops kept as named tokens so they stay
        // consistent everywhere instead of re-typing hexes per component.
        showdown: {
          violet: '#8b5cf6',
          cyan: '#22d3ee',
          pink: '#ec4899',
          orange: '#fb923c',
        },
      },
      fontFamily: {
        // Body copy — set in app/layout.jsx via next/font/google.
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Headings — chunky + geometric, also loaded in app/layout.jsx.
        display: ['var(--font-space-grotesk)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
