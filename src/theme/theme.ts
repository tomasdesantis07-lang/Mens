export const COLORS = {
  // Brand
  primary: "#6B4EFF",
  secondary: "#5A46FF",

  // Accents
  accent: "#FF6C47",
  warning: "#FFD25E",
  success: "#30D158",
  error: "#FF453A",

  // Backgrounds
  background: "#0D0D0F",
  surface: "#131316",
  card: "#1A1A1E",
  cardAlt: "#1F1F23",

  // Border / dividers
  border: "#2A2A2F",
  divider: "#2A2A2F",

  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "#A7A7AD",
  textTertiary: "#8A8A8F",
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