import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import React from 'react';
import { storage } from '../storage/mmkv';

// Create a custom storage adapter for TanStack Query (Hybrid MMKV / AsyncStorage)
const clientStorage = {
    setItem: async (key: string, value: string) => {
        if (storage) {
            storage.set(key, value);
            return Promise.resolve();
        }
        return AsyncStorage.setItem(key, value);
    },
    getItem: async (key: string) => {
        if (storage) {
            const value = storage.getString(key);
            return Promise.resolve(value === undefined ? null : value);
        }
        return AsyncStorage.getItem(key);
    },
    removeItem: async (key: string) => {
        if (storage) {
            storage.delete(key);
            return Promise.resolve();
        }
        return AsyncStorage.removeItem(key);
    },
};

// Create the persister
const persister = createAsyncStoragePersister({
    storage: clientStorage,
});

// Create the QueryClient
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            gcTime: 1000 * 60 * 60 * 24, // 24 hours (keep in cache)
            staleTime: 1000 * 60 * 60 * 24, // 24 hours (assume fresh, update via listeners)
            retry: 2,
        },
    },
});

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister }}
        >
            {children}
        </PersistQueryClientProvider>
    );
};

// Export client for use in non-component files (services)
export { queryClient };

