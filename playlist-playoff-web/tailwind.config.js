/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // The app's one accent color family now — replaces the old
        // violet/indigo/teal/cyan mix everywhere. DEFAULT matches the Hero
        // background's glow color exactly; light/deep are derived tints for
        // hover states, text-on-dark, and the GhostFibers line color.
        brand: {
          DEFAULT: '#3437A0',
          light: '#7B7DC1',
          deep: '#140E35',
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
