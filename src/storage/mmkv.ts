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

// Workout-specific storage helpers
const ACTIVE_WORKOUT_KEY = 'active_workout';

export const workoutStorage = {
    saveActiveWorkout: (workout: any) => {
        if (!mmkvAvailable || !workout) return;
        try {
            // Convert Set to Array for JSON serialization
            const serializable = {
                ...workout,
                completedSets: Array.from(workout.completedSets || [])
            };
            storage?.set(ACTIVE_WORKOUT_KEY, JSON.stringify(serializable));
        } catch (e) {
            console.error('MMKV saveActiveWorkout error', e);
        }
    },
    getActiveWorkout: (): any | null => {
        if (!mmkvAvailable) return null;
        try {
            const value = storage?.getString(ACTIVE_WORKOUT_KEY);
            if (!value) return null;
            const parsed = JSON.parse(value);
            // Convert Array back to Set
            return {
                ...parsed,
                completedSets: new Set(parsed.completedSets || [])
            };
        } catch (e) {
            console.error('MMKV getActiveWorkout error', e);
            return null;
        }
    },
    clearActiveWorkout: () => {
        if (!mmkvAvailable) return;
        try {
            storage?.delete(ACTIVE_WORKOUT_KEY);
        } catch (e) {
            console.error('MMKV clearActiveWorkout error', e);
        }
    }
};
