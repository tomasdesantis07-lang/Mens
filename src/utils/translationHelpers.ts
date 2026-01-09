import i18n from 'i18next';

/**
 * Translates a string if it looks like a translation key (contains a dot).
 * This provides backward compatibility for routines created before we started
 * saving translated names directly.
 * 
 * For example:
 * - "routine_templates.routine_fb_3d" → "MENS Fullbody 3 días"
 * - "MENS Fullbody 3 días" → "MENS Fullbody 3 días" (unchanged)
 * 
 * @param text - The text to translate (may be a key or plain text)
 * @param tFunc - Optional translation function from useTranslation(). 
 *                If provided, uses React's t() for re-renders on language change.
 *                If not provided, uses i18n.t() directly.
 */
export const translateIfKey = (
    text: string | undefined | null,
    tFunc?: (key: string) => string
): string => {
    if (!text) return '';

    // If it looks like a translation key (contains a dot and no spaces),
    // try to translate it
    if (text.includes('.') && !text.includes(' ')) {
        const t = tFunc || i18n.t;
        const translated = t(text);
        // If translation returns the same key, it means it wasn't found,
        // so return the original text
        return translated !== text ? translated : text;
    }

    return text;
};
