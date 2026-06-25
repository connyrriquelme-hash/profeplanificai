export const theme = {
  color: {
    brand: '#6d5dfc',
    brand2: '#00a7a7',
    brand3: '#a78bfa',
    bg: '#ffffff',
    bg2: '#f8f9fa',
    bg3: '#f1f3f4',
    card: '#ffffff',
    ink: '#1a1a2e',
    ink2: '#333333',
    muted: '#6b7280',
    muted2: '#9ca3af',
    line: '#e5e7eb',
    line2: '#d1d5db',
    success: '#16a34a',
    warning: '#f59e0b',
    error: '#dc2626',
    white: '#ffffff',
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray600: '#4b5563',
    gray700: '#374151',
    gray900: '#111827',
    indigo600: '#4f46e5',
  },
  radius: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    xl: '22px',
    full: '9999px',
    default: '16px',
  },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,.05)',
    md: '0 4px 12px rgba(0,0,0,.06)',
    lg: '0 8px 24px rgba(0,0,0,.08)',
    xl: '0 12px 32px rgba(0,0,0,.1)',
  },
  font: {
    sans: "'Segoe UI', Roboto, Arial, sans-serif",
  },
  transition: {
    fast: '150ms cubic-bezier(.4,0,.2,1)',
    base: '250ms cubic-bezier(.4,0,.2,1)',
  },
  spacing: (n: number) => `${n * 4}px`,
  borderRadius: (n: number) => `${n * 4}px`,
} as const;

export const borderStyles = {
  card: `1px solid ${theme.color.line}`,
  cardRounded: `${theme.radius.lg}`,
  input: `1px solid ${theme.color.line}`,
  focus: `0 0 0 3px rgba(109,93,252,0.12)`,
} as const;

export const buttonBase = {
  primary: {
    background: theme.color.brand,
    color: theme.color.white,
    border: 'none',
    borderRadius: theme.radius.md,
    padding: '10px 20px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: `all ${theme.transition.fast}`,
  },
  secondary: {
    background: theme.color.white,
    color: theme.color.ink,
    border: `1px solid ${theme.color.line}`,
    borderRadius: theme.radius.md,
    padding: '10px 20px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: `all ${theme.transition.fast}`,
  },
  ghost: {
    background: 'transparent',
    color: theme.color.ink,
    border: 'none',
    borderRadius: theme.radius.md,
    padding: '6px 12px',
    fontSize: 13,
    cursor: 'pointer',
    transition: `all ${theme.transition.fast}`,
  },
  small: {
    padding: '6px 14px',
    fontSize: 12,
    borderRadius: theme.radius.md,
  },
} as const;

export const cardStyles = {
  wrapper: {
    background: theme.color.card,
    border: borderStyles.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing(6),
  },
  section: {
    marginBottom: theme.spacing(4),
  },
} as const;
