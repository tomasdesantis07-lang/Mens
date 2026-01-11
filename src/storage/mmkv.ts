// MMKV Storage Adapter - Safe fallback version
// Provides a no-op implementation if MMKV native module is not available

let storageInstance: any = null;
let mmkvAvailable = false;

try {
    const mmkvModule = require('react-native-mmkv');
    if (mmkvModule && mmkvModule.MMKV) {
        storageInstance = new mmkvModule.MMKV();
        mmkvAvailable = true;
        console.log('[MMKV] Successfully initialized');
    }
} catch (e) {
    console.warn('[MMKV] Native module not available - caching disabled. Run `npx expo run:android` to rebuild.');
}

export const storage = storageInstance;

export const MMKVStorage = {
    setItem: (key: string, value: any) => {
        if (!mmkvAvailable) return;
        try {
            storage?.set(key, JSON.stringify(value));
        } catch (e) {
            console.error('MMKV setItem error', e);
        }
    },
    getItem: <T>(key: string): T | null => {
        if (!mmkvAvailable) return null;
        try {
            const value = storage?.getString(key);
            return value ? JSON.parse(value) : null;
        } catch (e) {
            console.error('MMKV getItem error', e);
            return null;
        }
    },
    removeItem: (key: string) => {
        if (!mmkvAvailable) return;
        try {
            storage?.delete(key);
        } catch (e) {
            console.error('MMKV removeItem error', e);
        }
    },
    clearAll: () => {
        if (!mmkvAvailable) return;
        try {
            storage?.clearAll();
        } catch (e) {
            console.error('MMKV clearAll error', e);
        }
    }
};
