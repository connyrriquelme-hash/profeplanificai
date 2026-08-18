export const theme = {
  color: {
    brand: '#B5471F',
    brand2: '#D97706',
    brand3: '#0EA5E9',
    bg: '#F8FAFC',
    bg2: '#F1F5F9',
    bg3: '#E2E8F0',
    card: '#FFFFFF',
    ink: '#1E293B',
    ink2: '#334155',
    muted: '#64748B',
    muted2: '#94A3B8',
    line: '#E2E8F0',
    line2: '#F1F5F9',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    white: '#FFFFFF',
    gray50: '#F8FAFC',
    gray100: '#F1F5F9',
    gray200: '#E2E8F0',
    gray400: '#94A3B8',
    gray500: '#64748B',
    gray600: '#475569',
    gray700: '#334155',
    gray900: '#1E293B',
    primary: '#B5471F',
    primaryHover: '#9A3A17',
    primaryTint: '#FEF3E2',
  },
  radius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
    default: '12px',
  },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
    md: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
    lg: '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)',
    xl: '0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04)',
  },
  font: {
    sans: "'Outfit', ui-sans-serif, system-ui, sans-serif",
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
  focus: `0 0 0 3px rgba(181,71,31,0.1)`,
} as const;

export const buttonBase = {
  primary: {
    background: theme.color.primary,
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
