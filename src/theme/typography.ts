import { TextStyle } from 'react-native';

// ============================================================================
// FONT FAMILY - Antigravity Typography System
// ============================================================================
// Dela Gothic One: Industrial/sci-fi display font for titles and hero text
// Inter: Modern UI font for body text, buttons, and data display
export const FONT_FAMILY = {
    // Display font - Dela Gothic One (brutalist, industrial)
    display: 'Antigravity-Display',

    // UI fonts - Inter family (clean, technical)
    regular: 'Antigravity-UI-Reg',
    medium: 'Antigravity-UI-Reg', // Inter doesn't have medium, fallback to regular
    bold: 'Antigravity-UI-Bold',
    heavy: 'Antigravity-UI-Black',
};

// ============================================================================
// FONT WEIGHTS
// ============================================================================
export const FONT_WEIGHT = {
    regular: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semibold: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
    heavy: '800' as TextStyle['fontWeight'],
};

// ============================================================================
// FONT SIZES - Technical Scale
// ============================================================================
export const FONT_SIZE = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 24,
    xxxl: 32,
    display: 40,
};

// ============================================================================
// LETTER SPACING - For "Strong & Technical" Aesthetic
// ============================================================================
export const LETTER_SPACING = {
    tighter: -1,
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2,
};

// ============================================================================
// LINE HEIGHTS
// ============================================================================
export const LINE_HEIGHT = {
    tight: 1.1,
    normal: 1.4,
    relaxed: 1.6,
};

// ============================================================================
// TYPOGRAPHY PRESETS (Ready-to-use styles)
// ============================================================================
export const TYPOGRAPHY = {
    // Display / Hero text - Uses Dela Gothic One for brutalist impact
    display: {
        fontFamily: FONT_FAMILY.display,
        fontSize: FONT_SIZE.display,
        letterSpacing: LETTER_SPACING.tighter,
    } as TextStyle,

    // Headings - Use Inter Bold for clean, modern headers
    h1: {
        fontFamily: FONT_FAMILY.bold,
        fontSize: FONT_SIZE.xxxl,
        letterSpacing: LETTER_SPACING.tight,
    } as TextStyle,

    h2: {
        fontFamily: FONT_FAMILY.bold,
        fontSize: FONT_SIZE.xxl,
        letterSpacing: LETTER_SPACING.tight,
    } as TextStyle,

    h3: {
        fontFamily: FONT_FAMILY.bold,
        fontSize: FONT_SIZE.lg,
        letterSpacing: LETTER_SPACING.normal,
    } as TextStyle,

    h4: {
        fontFamily: FONT_FAMILY.bold,
        fontSize: FONT_SIZE.md,
        letterSpacing: LETTER_SPACING.normal,
    } as TextStyle,

    // Body text - Uses Inter Regular for readability
    body: {
        fontFamily: FONT_FAMILY.regular,
        fontSize: FONT_SIZE.md,
        letterSpacing: LETTER_SPACING.normal,
        lineHeight: FONT_SIZE.md * LINE_HEIGHT.normal,
    } as TextStyle,

    bodySmall: {
        fontFamily: FONT_FAMILY.regular,
        fontSize: FONT_SIZE.sm,
        letterSpacing: LETTER_SPACING.normal,
    } as TextStyle,

    bodyLarge: {
        fontFamily: FONT_FAMILY.regular,
        fontSize: FONT_SIZE.lg,
        letterSpacing: LETTER_SPACING.normal,
        lineHeight: FONT_SIZE.lg * LINE_HEIGHT.normal,
    } as TextStyle,

    // Interface / Technical - Uses Inter Bold for labels
    label: {
        fontFamily: FONT_FAMILY.bold,
        fontSize: FONT_SIZE.xs,
        letterSpacing: LETTER_SPACING.wider,
        textTransform: 'uppercase',
    } as TextStyle,

    button: {
        fontFamily: FONT_FAMILY.bold,
        fontSize: FONT_SIZE.md,
        letterSpacing: LETTER_SPACING.wide,
    } as TextStyle,

    buttonSmall: {
        fontFamily: FONT_FAMILY.bold,
        fontSize: FONT_SIZE.sm,
        letterSpacing: LETTER_SPACING.wide,
    } as TextStyle,

    // Numbers / Data Display - Uses Inter Black for maximum impact
    numberBig: {
        fontFamily: FONT_FAMILY.heavy,
        fontSize: FONT_SIZE.display,
        letterSpacing: LETTER_SPACING.tight,
        fontVariant: ['tabular-nums'],
    } as TextStyle,

    numberMedium: {
        fontFamily: FONT_FAMILY.heavy,
        fontSize: FONT_SIZE.xxl,
        letterSpacing: LETTER_SPACING.normal,
        fontVariant: ['tabular-nums'],
    } as TextStyle,

    numberSmall: {
        fontFamily: FONT_FAMILY.bold,
        fontSize: FONT_SIZE.lg,
        letterSpacing: LETTER_SPACING.normal,
        fontVariant: ['tabular-nums'],
    } as TextStyle,

    // Captions / Secondary - Uses Inter Regular
    caption: {
        fontFamily: FONT_FAMILY.regular,
        fontSize: FONT_SIZE.xs,
        letterSpacing: LETTER_SPACING.normal,
    } as TextStyle,
};
