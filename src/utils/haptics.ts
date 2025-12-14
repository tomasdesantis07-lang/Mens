import * as Haptics from "expo-haptics";

/**
 * Utility wrapper for haptic feedback with semantic naming
 */
export const MensHaptics = {
    /**
     * Light haptic feedback - for subtle interactions like hovering or selection
     */
    light: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },

    /**
     * Medium haptic feedback - for standard button presses
     */
    medium: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },

    /**
     * Heavy haptic feedback - for important actions or confirmations
     */
    heavy: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    },

    /**
     * Success haptic feedback - for successful operations
     */
    success: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },

    /**
     * Warning haptic feedback - for warnings or alerts
     */
    warning: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    },

    /**
     * Error haptic feedback - for errors or failed operations
     */
    error: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },

    /**
     * Selection haptic feedback - for picker/selector changes
     */
    selection: () => {
        Haptics.selectionAsync();
    },
};
