
// Strict MMKV Storage Adapter with In-Memory Fallback
// This approach ensures the app works in Expo Go (non-persistent) and Dev Builds (persistent)


interface StorageAdapter {
    set: (key: string, value: string) => void;
    getString: (key: string) => string | undefined;
    delete: (key: string) => void;
    clearAll: () => void;
}

let storage: StorageAdapter;

try {
    // Use require to get the actual class (avoids TS type-only interpretation)
    const { MMKV } = require('react-native-mmkv');
    const mmkv = new MMKV();
    storage = {
        set: (key, value) => mmkv.set(key, value),
        getString: (key) => mmkv.getString(key),
        delete: (key) => mmkv.delete(key),
        clearAll: () => mmkv.clearAll(),
    };
    console.log('[Storage] MMKV initialized successfully');
} catch (e) {
    console.warn('[Storage] MMKV failed to initialize (missing native module?). Falling back to In-Memory storage.');

    // In-Memory Fallback
    const memoryStore = new Map<string, string>();
    storage = {
        set: (key, value) => memoryStore.set(key, value),
        getString: (key) => memoryStore.get(key),
        delete: (key) => memoryStore.delete(key),
        clearAll: () => memoryStore.clear(),
    };
}

export const MMKVStorage = {
    setItem: (key: string, value: any) => {
        try {
            storage.set(key, JSON.stringify(value));
        } catch (e) {
            console.error('Storage setItem error', e);
        }
    },
    getItem: <T>(key: string): T | null => {
        try {
            const value = storage.getString(key);
            return value ? JSON.parse(value) : null;
        } catch (e) {
            console.error('Storage getItem error', e);
            return null;
        }
    },
    removeItem: (key: string) => {
        try {
            storage.delete(key);
        } catch (e) {
            console.error('Storage removeItem error', e);
        }
    },
    clearAll: () => {
        try {
            storage.clearAll();
        } catch (e) {
            console.error('Storage clearAll error', e);
        }
    }
};

// Workout-specific storage helpers
const ACTIVE_WORKOUT_KEY = 'active_workout';

export const workoutStorage = {
    saveActiveWorkout: (workout: any) => {
        if (!workout) {
            storage.delete(ACTIVE_WORKOUT_KEY);
            return;
        }
        try {
            // Convert Set to Array for JSON serialization
            const serializable = {
                ...workout,
                completedSets: Array.from(workout.completedSets || [])
            };
            storage.set(ACTIVE_WORKOUT_KEY, JSON.stringify(serializable));
        } catch (e) {
            console.error('Storage saveActiveWorkout error', e);
        }
    },
    getActiveWorkout: (): any | null => {
        try {
            const value = storage.getString(ACTIVE_WORKOUT_KEY);
            if (!value) return null;
            const parsed = JSON.parse(value);
            // Convert Array back to Set
            return {
                ...parsed,
                completedSets: new Set(parsed.completedSets || [])
            };
        } catch (e) {
            console.error('Storage getActiveWorkout error', e);
            return null;
        }
    },
    clearActiveWorkout: () => {
        try {
            storage.delete(ACTIVE_WORKOUT_KEY);
        } catch (e) {
            console.error('Storage clearActiveWorkout error', e);
        }
    }
};
