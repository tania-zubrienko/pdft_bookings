// ┌─────────────────────────────────────────────────────────────────────────┐
// │  THEME TOKENS — change values here to retheme the entire app            │
// └─────────────────────────────────────────────────────────────────────────┘
const THEME = {
  // Brand ────────────────────────────────────────────────────────────────
  brand: '#162dc9',   // logo, buttons, active-nav highlight
  brandLight: '#818cf8',   // lighter brand for text on dark backgrounds

  // Background layers (dark → light) ────────────────────────────────────
  pageBg: '#030712',   // body / page background          (bg-ui-page)
  headerBg: '#000000', // header + footer                 (bg-ui-header)
  cardBg: '#111827',   // cards, panels                   (bg-ui-card)
  inputBg: '#1f2937',  // inputs, secondary buttons       (bg-ui-input)
  hoverBg: '#374151',  // hover / active states           (bg-ui-hover)

  // Borders ─────────────────────────────────────────────────────────────
  borderStrong: '#374151', // visible borders                 (border-ui-border)
  borderSoft: '#1f2937',   // subtle / divider borders        (border-ui-border-soft)

  // Class accent bar colours ────────────────────────────────────────────
  accentBlue: '#3b82f6',   // Pole Dance classes
  accentGreen: '#10b981',  // Open / Stretching classes
  accentPink: '#ec4899',   // Exotic classes
  accentYellow: '#eab308', // Aro / calendar selected day

  // Text colours ────────────────────────────────────────────────────────
  textPrimary: '#f9fafb',  // main body text               (text-ui-text)
  textSecondary: '#9ca3af',  // subtitles, meta info         (text-ui-text-soft)
  textMuted: '#6b7280',  // placeholders, disabled       (text-ui-text-muted)
  textInverse: '#ffffff',  // text on brand-coloured bg    (text-ui-text-inverse)
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    // Class accent bar colors (dynamically computed in ClassCard)
    'bg-accent-pink',
    'bg-accent-blue',
    'bg-accent-green',
    'bg-accent-yellow',
    // Brand / semantic tokens used as runtime-computed values
    'bg-brand',
    'hover:border-brand',
    'bg-primary-400',
    'bg-primary-600',
  ],
  theme: {
    extend: {
      colors: {
        // ── Semantic tokens — reference these in components ──────────────
        brand: THEME.brand,
        'brand-light': THEME.brandLight,
        'ui-page': THEME.pageBg,
        'ui-header': THEME.headerBg,
        'ui-card': THEME.cardBg,
        'ui-input': THEME.inputBg,
        'ui-hover': THEME.hoverBg,
        'ui-border': THEME.borderStrong,
        'ui-border-soft': THEME.borderSoft,
        'ui-text': THEME.textPrimary,
        'ui-text-soft': THEME.textSecondary,
        'ui-text-muted': THEME.textMuted,
        'ui-text-inverse': THEME.textInverse,

        // ── Primary palette (backward-compat; 600/700/800 follow brand) ──
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: THEME.brandLight,
          500: '#4f46e5',
          600: THEME.brand,
          700: THEME.brand,
          800: THEME.brand,
          900: '#1e1b4b',
        },

        // ── Class-type accent bar colours ─────────────────────────────────
        accent: {
          blue: THEME.accentBlue,
          green: THEME.accentGreen,
          pink: THEME.accentPink,
          yellow: THEME.accentYellow,
        },
      },
    },
  },
  plugins: [],
};
