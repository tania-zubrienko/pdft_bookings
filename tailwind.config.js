// ┌─────────────────────────────────────────────────────────────────────────┐
// │  THEME TOKENS — change values here to retheme the entire app            │
// └─────────────────────────────────────────────────────────────────────────┘
const THEME = {
  // Brand ────────────────────────────────────────────────────────────────
  brand: '#c526ce', // logo, buttons, active-nav highlight
  brandLight: '#e060e8', // lighter brand for text on dark backgrounds

  // Background layers (dark → light) ────────────────────────────────────
  pageBg: '#0d0511', // body / page background          (bg-ui-page)
  headerBg: '#080210', // header + footer                 (bg-ui-header)
  cardBg: '#170d1e', // cards, panels                   (bg-ui-card)
  inputBg: '#231530', // inputs, secondary buttons       (bg-ui-input)
  hoverBg: '#33203d', // hover / active states           (bg-ui-hover)

  // Borders ─────────────────────────────────────────────────────────────
  borderStrong: '#5F2960', // visible borders                 (border-ui-border)
  borderSoft: '#3a1840', // subtle / divider borders        (border-ui-border-soft)

  // Class accent bar colours ────────────────────────────────────────────
  accentBlue: '#5810B5', // Pole Dance classes  (deep violet)
  accentGreen: '#4DB510', // Open / Stretching classes  (lime green)
  accentPink: '#c526ce', // Exotic classes  (magenta)
  accentYellow: '#e8a020', // Aro / calendar selected day

  // Text colours ────────────────────────────────────────────────────────
  textPrimary: '#f2eaf5', // main body text               (text-ui-text)
  textSecondary: '#c4a8cc', // subtitles, meta info         (text-ui-text-soft)
  textMuted: '#8a6a90', // placeholders, disabled       (text-ui-text-muted)
  textInverse: '#ffffff', // text on brand-coloured bg    (text-ui-text-inverse)
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
          500: '#811987',
          600: THEME.brand,
          700: THEME.brand,
          800: THEME.brand,
          900: '#4b1b49',
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
