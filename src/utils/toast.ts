import Toast from 'react-native-toast-message';

/**
 * Utility functions for showing toast notifications throughout the app
 */

export const showToast = {
    success: (message: string, title?: string) => {
        Toast.show({
            type: 'success',
            text1: title || '¡Éxito!',
            text2: message,
            position: 'top',
            visibilityTime: 3000,
            topOffset: 60,
        });
    },

    error: (message: string, title?: string) => {
        Toast.show({
            type: 'error',
            text1: title || 'Error',
            text2: message,
            position: 'top',
            visibilityTime: 4000,
            topOffset: 60,
        });
    },

    info: (message: string, title?: string) => {
        Toast.show({
            type: 'info',
            text1: title || 'Info',
            text2: message,
            position: 'top',
            visibilityTime: 3000,
            topOffset: 60,
        });
    },

    warning: (message: string, title?: string) => {
        Toast.show({
            type: 'info', // react-native-toast-message doesn't have warning by default
            text1: title || 'Atención',
            text2: message,
            position: 'top',
            visibilityTime: 3500,
            topOffset: 60,
        });
    },
};
