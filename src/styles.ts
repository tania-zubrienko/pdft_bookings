/**
 * UI — Centralized Tailwind class map
 *
 * Single source of truth for every recurring style token in the app.
 * Reference semantic colour tokens defined in tailwind.config.js (bg-ui-*, text-ui-*, border-ui-*).
 *
 * Usage:
 *   import UI from '@/lib/styles';
 *   <button className={UI.button.primary}>Save</button>
 *   <h1 className={UI.text.heading}>Title</h1>
 */
const UI = {
  // ─── Buttons ─────────────────────────────────────────────────────────────
  button: {
    base: 'btn btn-primary flex items-center gap-1.5 px-4 py-2 rounded-lg text-lg',
    /** Solid brand button — primary CTA */
    primary:
      'btn btn-primary flex items-center gap-1.5 px-4 py-2 rounded-lg hover:bg-brand',
    /** Muted surface button — secondary action */
    secondary:
      'bg-ui-input text-ui-text-soft border border-ui-border hover:bg-ui-hover',
    /** Transparent with brand border */
    outline: 'btn btn-outline text-sm flex items-center gap-1',
    /** Destructive / danger action */
    danger:
      'btn bg-red-900/50 text-white hover:bg-red-700/60 active:bg-red-700 border border-red-700',
    /** Ghost — no background, just text */
    ghost:
      'btn bg-transparent flex items-center gap-1.5 px-4 py-2 text-ui-text-soft hover:text-ui-text-inverse hover:bg-ui-hover',
    /** Icon-only button wrapper */
    icon: 'p-2 rounded-lg text-ui-text-soft hover:text-ui-text-inverse hover:bg-ui-hover transition-colors',
    /** Full-width variant (combine with any button style) */
    full: 'w-full',
  },

  // ─── Text ─────────────────────────────────────────────────────────────────
  text: {
    /** Page / section heading */
    heading: 'text-2xl sm:text-3xl font-bold text-ui-text-soft',
    /** Section heading muted description */
    headingDescription: 'text-ui-text-soft mt-1',
    /** Sub-heading / card title */
    subheading: 'text-lg sm:text-xl font-semibold text-ui-text-soft',
    /** Standard body copy */
    body: 'text-m text-ui-text',
    /** Secondary / meta information */
    soft: 'text-m text-ui-text-soft',
    /** Placeholder / disabled / hint text */
    muted: 'text-sm text-ui-text-soft',
    /** Labels (form fields, detail grid) */
    label: 'text-xs font-medium text-ui-text-muted uppercase tracking-wide',
    /** Inline error message */
    error: 'text-m text-red-400',
    /** Inline success message */
    success: 'text-m text-green-400',
    /** Brand-accented text (active nav, highlights) */
    brand: 'text-brand',
    /** Light brand text on dark backgrounds */
    brandLight: 'text-brand-light',
  },

  // ─── Layout / Containers ──────────────────────────────────────────────────
  layout: {
    /** Centred page wrapper with horizontal padding */
    page: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    /** Full-height page root */
    root: 'min-h-screen bg-ui-page',
    /** Standard vertical section gap */
    section: 'py-8',
    /** Two-column grid (single column on mobile) */
    grid2: 'grid grid-cols-1 md:grid-cols-2 gap-6',
    /** Three-column grid */
    grid3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    /** Four-column grid */
    grid4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6',
    /** Horizontal flex row with vertical centering */
    row: 'flex items-center gap-4',
    /** Flex column */
    col: 'flex flex-col gap-4',
  },

  // ─── Cards ────────────────────────────────────────────────────────────────
  card: {
    /** Standard content card */
    base: 'card',
    /** Card body padding */
    body: 'p-6',
    /** Smaller padding for dense cards */
    bodyCompact: 'p-4',
    /** Card with brand border on hover */
    interactive:
      'card hover:border-brand transition-all duration-200 cursor-pointer',
    /** Stat / highlight card */
    stat: 'bg-ui-card rounded-xl border border-ui-border-soft p-4 flex flex-col gap-1',
    /** Row hover state inside a card list */
    rowHover: 'hover:bg-ui-hover rounded-xl',
    // ── Inverse (light / modal) variants ──────────────────────────────────
    /** Modal/dialog container — light surface */
    modal:
      'bg-ui-card rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto',
    /** Modal header bar */
    modalHeader: `flex items-center justify-between px-6 py-4 border-b border-ui-border`,
    /** Modal scrollable body */
    modalBody: 'px-6 py-4 space-y-4',
    /** Modal footer actions bar */
    modalFooter:
      'flex items-center justify-end gap-3 px-6 py-4 border-t border-ui-border',
  },

  // ─── Forms ────────────────────────────────────────────────────────────────
  form: {
    /** Text / email / number / date input */
    input: 'input bg-ui-input',
    /** <select> element */
    select: 'input cursor-pointer bg-ui-input',
    /** <textarea> */
    textarea: 'input resize-none bg-ui-input',
    /** Wrapper that stacks label + control */
    field: 'flex flex-col gap-1',
    /** Form section with multiple fields */
    group: 'flex flex-col gap-4',
    /** Inline error below an input */
    inputError:
      'w-full px-4 py-2 bg-ui-input border border-red-500 text-ui-text rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500',
    /** Form section divider */
    divider: 'border-t border-ui-border-soft my-4',
  },

  // ─── Modal / overlay ──────────────────────────────────────────────────────
  modal: {
    /** Full-screen backdrop */
    backdrop:
      'fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4',
  },

  // ─── Badges / Pills ───────────────────────────────────────────────────────
  badge: {
    /** Generic neutral badge */
    base: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
    /** Green — active / confirmed */
    green:
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-400 border border-green-800',
    /** Amber — warning / expiring soon / few spots */
    amber:
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-900/50 text-amber-400 border border-amber-800',
    /** Red — error / full / expired / cancelled */
    red: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/50 text-red-400 border border-red-800',
    /** Blue — future / informational */
    blue: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand/30 text-ui-text border border-ui-border',
    /** Brand — featured / highlighted */
    brand:
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand text-white',
  },

  // ─── Status indicators (spots, credit, reservation state) ─────────────────
  status: {
    /** Available / plenty of spots */
    available: 'text-green-400',
    /** Few spots left */
    limited: 'text-amber-400',
    /** Fully booked */
    full: 'text-red-400',
    /** Active credit pool */
    active: 'text-green-400',
    /** Future / not-yet-valid credit pool */
    future: 'text-brand-light',
    /** Expired credit pool */
    expired: 'text-ui-text-muted',
  },

  // ─── Navigation ───────────────────────────────────────────────────────────
  nav: {
    /** Active desktop nav link */
    linkActive: 'text-brand-light font-medium',
    /** Inactive desktop nav link */
    linkInactive: 'text-ui-text hover:text-brand-light transition-colors',
    /** Mobile menu item */
    mobileLink:
      'block px-4 py-3 text-ui-text hover:text-ui-text-inverse hover:bg-ui-hover rounded-lg transition-colors',
    /** Mobile menu item — active */
    mobileLinkActive:
      'block px-4 py-3 text-brand-light font-medium bg-ui-input rounded-lg',
  },

  // ─── Feedback / Alerts ────────────────────────────────────────────────────
  alert: {
    /** Error / destructive alert box */
    error:
      'flex items-center gap-3 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm',
    /** Success alert box */
    success:
      'flex items-center gap-3 p-4 bg-green-900/30 border border-green-700 rounded-lg text-green-400 text-sm',
    /** Informational alert box */
    info: 'flex items-center gap-3 p-4 bg-blue-900/30 border border-blue-700 rounded-lg text-blue-400 text-sm',
    /** Warning alert box */
    warning:
      'flex items-center gap-3 p-4 bg-amber-900/30 border border-amber-700 rounded-lg text-amber-400 text-sm',
  },

  // ─── Loading ──────────────────────────────────────────────────────────────
  loading: {
    /** Centred full-area spinner container */
    container: 'flex items-center justify-center min-h-[400px]',
    /** Spinner ring */
    spinner: 'animate-spin rounded-full h-12 w-12 border-b-2 border-brand',
    /** Inline small spinner */
    spinnerSm: 'animate-spin rounded-full h-5 w-5 border-b-2 border-white',
  },

  // ─── Header / Page top ────────────────────────────────────────────────────
  header: {
    /** Sticky app header */
    bar: 'bg-ui-header shadow-sm border-b border-ui-border sticky top-0 z-50',
    /** Inner wrapper (same as layout.page + fixed height) */
    inner:
      'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16',
    /** Logo mark square */
    logoMark: 'w-10 h-10 bg-brand rounded-lg flex items-center justify-center',
    /** App name text */
    logoText: 'font-bold text-lg text-white leading-tight',
    /** App subtitle / role text */
    logoSub: 'text-xs text-ui-text-muted leading-tight',
  },

  // ─── Stats rows ───────────────────────────────────────────────────────────
  stats: {
    /** Responsive grid wrapper for stat cards */
    grid: 'grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6',
    /** Individual stat card */
    card: 'bg-ui-card rounded-xl border border-ui-border-soft px-4 py-3',
    /** Large stat number — neutral */
    value: 'text-2xl font-bold text-ui-text',
    /** Large stat number — positive / confirmed */
    valueGreen: 'text-2xl font-bold text-green-400',
    /** Large stat number — negative / cancelled */
    valueRed: 'text-2xl font-bold text-red-400',
    /** Large stat number — brand accent */
    valueBrand: 'text-2xl font-bold text-brand-light',
    /** Stat label below the number */
    label: 'text-xs text-ui-text-muted mt-0.5',
  },

  // ─── Dividers ─────────────────────────────────────────────────────────────
  divider: {
    /** Horizontal rule */
    h: 'border-t border-ui-border-soft',
    /** Vertical separator */
    v: 'border-l border-ui-border-soft',
  },

  // ─── Class accent bars (ClassCard left border) ────────────────────────────
  classAccent: {
    pole: 'bg-accent-blue',
    exotic: 'bg-accent-pink',
    aro: 'bg-accent-yellow',
    open: 'bg-accent-green',
    default: 'bg-brand',
  },
} as const;

/**
 * Returns the left-border accent colour class for a given class title.
 * Matches by substring so "Exotic Pole Dance" → pink, "Pole Dance" → blue.
 */
export function getClassAccent(classTitle: string): string {
  const t = classTitle.toLowerCase();
  if (t.includes('exotic')) return UI.classAccent.exotic;
  if (t.includes('pole')) return UI.classAccent.pole;
  if (t.includes('aro')) return UI.classAccent.aro;
  if (t.includes('open') || t.includes('stretch')) return UI.classAccent.open;
  return UI.classAccent.default;
}

export default UI;
