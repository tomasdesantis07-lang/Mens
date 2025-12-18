export const COLORS = {
  // Brand - Paleta 
  primary: "#2962FF",
  secondary: "#0039CB",

  // Accents
  accent: "#00B0FF",
  warning: "#FFAB00",
  success: "#00C853",
  error: "#D50000",

  // Backgrounds
  background: "#050505",
  surface: "#0B0E14",
  card: "#151922",
  cardAlt: "#1E2430",

  // Border / dividers
  border: "#2A303C",
  divider: "#1C212B",

  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "#94A3B8",
  textTertiary: "#64748B",
  textInverse: "#FFFFFF",
};

export const COMPONENTS = {
  button: {
    solid: {
      background: COLORS.primary,
      text: COLORS.textInverse,
    },
    outline: {
      background: "transparent",
      border: COLORS.primary,
      text: COLORS.primary,
    },
    ghost: {
      background: "transparent",
      text: COLORS.textPrimary,
    },
  },

  badge: {
    primary: { background: COLORS.primary, text: COLORS.textInverse },
    success: { background: COLORS.success, text: COLORS.textInverse },
    warning: { background: COLORS.warning, text: COLORS.background },
    info: { background: "#3A59FF", text: COLORS.textInverse },
    outline: {
      background: "transparent",
      border: COLORS.primary,
      text: COLORS.primary,
    },
  },

  input: {
    background: COLORS.card,
    border: COLORS.border,
    placeholder: COLORS.textTertiary,
    focusBorder: COLORS.primary,
  },
};
export const theme = { COLORS, COMPONENTS };

// Re-export typography for convenience
export {
  FONT_FAMILY,
  FONT_SIZE,
  FONT_WEIGHT,
  LETTER_SPACING,
  LINE_HEIGHT,
  TYPOGRAPHY
} from './typography';
