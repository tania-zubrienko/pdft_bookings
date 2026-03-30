/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    'bg-accent-pink',
    'bg-accent-blue',
    'bg-accent-green',
    'bg-accent-yellow',
    'bg-primary-400',
    'bg-primary-600',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',   // Light blue backgrounds
          100: '#e0e7ff',  // Avatar backgrounds, badges
          200: '#c7d2fe',  // Light borders/highlights
          300: '#a5b4fc',  // Soft accent states
          400: '#818cf8',  // Lighter accent states
          500: '#4f46e5',  // Focus rings, borders
          600: '#162dc9',  // Main brand color (buttons, logo, selected calendar items)
          700: '#162dc9',  // Keep same for consistent hover
          800: '#162dc9',  // Keep same for consistent active
          900: '#1e1b4b',  // Darkest shade
        },
        accent: {
          blue: '#3b82f6',    // Blue accent (for POLE DANCE classes)
          green: '#10b981',   // Green accent (for OPEN classes)
          pink: '#ec4899',    // Pink accent (alternative classes)
          yellow: '#eab308',  // Yellow accent (for selected/active day)
        },
      },
    },
  },
  plugins: [],
};
