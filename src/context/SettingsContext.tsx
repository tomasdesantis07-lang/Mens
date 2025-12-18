import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type WeightUnit = 'kg' | 'lb';

interface SettingsContextType {
    weightUnit: WeightUnit;
    setWeightUnit: (unit: WeightUnit) => void;
    hapticsEnabled: boolean;
    setHapticsEnabled: (enabled: boolean) => void;
    autoTimer: boolean;
    setAutoTimer: (enabled: boolean) => void;
    soundsEnabled: boolean;
    setSoundsEnabled: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEYS = {
    WEIGHT_UNIT: '@settings_weight_unit',
    HAPTICS_ENABLED: '@settings_haptics_enabled',
    AUTO_TIMER: '@settings_auto_timer',
    SOUNDS_ENABLED: '@settings_sounds_enabled',
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [weightUnit, setWeightUnitState] = useState<WeightUnit>('kg');
    const [hapticsEnabled, setHapticsEnabledState] = useState(true);
    const [autoTimer, setAutoTimerState] = useState(true);
    const [soundsEnabled, setSoundsEnabledState] = useState(true);

    // Load settings from storage on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const [unit, haptics, timer, sounds] = await Promise.all([
                    AsyncStorage.getItem(STORAGE_KEYS.WEIGHT_UNIT),
                    AsyncStorage.getItem(STORAGE_KEYS.HAPTICS_ENABLED),
                    AsyncStorage.getItem(STORAGE_KEYS.AUTO_TIMER),
                    AsyncStorage.getItem(STORAGE_KEYS.SOUNDS_ENABLED),
                ]);

                if (unit) setWeightUnitState(unit as WeightUnit);
                if (haptics !== null) setHapticsEnabledState(haptics === 'true');
                if (timer !== null) setAutoTimerState(timer === 'true');
                if (sounds !== null) setSoundsEnabledState(sounds === 'true');
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        };

        loadSettings();
    }, []);

    const setWeightUnit = async (unit: WeightUnit) => {
        setWeightUnitState(unit);
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.WEIGHT_UNIT, unit);
        } catch (error) {
            console.error('Error saving weight unit:', error);
        }
    };

    const setHapticsEnabled = async (enabled: boolean) => {
        setHapticsEnabledState(enabled);
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.HAPTICS_ENABLED, String(enabled));
        } catch (error) {
            console.error('Error saving haptics setting:', error);
        }
    };

    const setAutoTimer = async (enabled: boolean) => {
        setAutoTimerState(enabled);
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.AUTO_TIMER, String(enabled));
        } catch (error) {
            console.error('Error saving auto timer setting:', error);
        }
    };

    const setSoundsEnabled = async (enabled: boolean) => {
        setSoundsEnabledState(enabled);
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.SOUNDS_ENABLED, String(enabled));
        } catch (error) {
            console.error('Error saving sounds setting:', error);
        }
    };

    return (
        <SettingsContext.Provider
            value={{
                weightUnit,
                setWeightUnit,
                hapticsEnabled,
                setHapticsEnabled,
                autoTimer,
                setAutoTimer,
                soundsEnabled,
                setSoundsEnabled,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
