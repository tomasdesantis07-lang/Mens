import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// Context for Stable Actions & Low-Frequency State (Status)
// Consumers of this will NOT re-render every second.
interface WorkoutTimerContextType {
    startTime: number | null;
    restEndTime: number | null;
    isResting: boolean;
    startRest: (seconds: number) => void;
    stopRest: () => void;
    setStartTime: (startTime: number | null) => void;
}

// Context for High-Frequency Ticks (1Hz)
// Consumers of this WILL re-render every second.
interface WorkoutTickContextType {
    elapsedTime: number;
    restRemaining: number;
}

const WorkoutTimerContext = createContext<WorkoutTimerContextType | undefined>(undefined);
const WorkoutTickContext = createContext<WorkoutTickContextType | undefined>(undefined);

export const WorkoutTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Persistent State
    const [startTime, setStartTimeState] = useState<number | null>(null);
    const [restEndTime, setRestEndTime] = useState<number | null>(null);

    // Volatile State (Ticks)
    const [elapsedTime, setElapsedTime] = useState(0);
    const [restRemaining, setRestRemaining] = useState(0);

    // Workout Timer Logic (Tick)
    useEffect(() => {
        if (!startTime) {
            setElapsedTime(0);
            return;
        }

        // Initial sync
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));

        const interval = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    // Rest Timer Logic (Tick)
    useEffect(() => {
        if (!restEndTime) {
            setRestRemaining(0);
            return;
        }

        const update = () => {
            const now = Date.now();
            const diff = Math.ceil((restEndTime - now) / 1000);

            if (diff <= 0) {
                setRestRemaining(0);
                setRestEndTime(null);
            } else {
                setRestRemaining(diff);
            }
        };

        update(); // Immediate update
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [restEndTime]);

    // Actions
    const startRest = useCallback((seconds: number) => {
        setRestEndTime(Date.now() + seconds * 1000);
    }, []);

    const stopRest = useCallback(() => {
        setRestEndTime(null);
        setRestRemaining(0);
    }, []);

    const setStartTime = useCallback((time: number | null) => {
        setStartTimeState(time);
    }, []);

    const isResting = !!restEndTime;

    // Stable Context Value (Actions + Status)
    const timerContextValue = useMemo(() => ({
        startTime,
        restEndTime,
        isResting,
        startRest,
        stopRest,
        setStartTime
    }), [startTime, restEndTime, isResting, startRest, stopRest, setStartTime]);

    // Volatile Context Value (Ticks)
    const tickContextValue = useMemo(() => ({
        elapsedTime,
        restRemaining
    }), [elapsedTime, restRemaining]);

    return (
        <WorkoutTimerContext.Provider value={timerContextValue}>
            <WorkoutTickContext.Provider value={tickContextValue}>
                {children}
            </WorkoutTickContext.Provider>
        </WorkoutTimerContext.Provider>
    );
};

// Hook for Actions & Status (Stable)
export const useWorkoutTimerContext = () => {
    const context = useContext(WorkoutTimerContext);
    if (!context) {
        throw new Error("useWorkoutTimerContext must be used within a WorkoutTimerProvider");
    }
    return context;
};

// Hook for Ticks (Volatile - Re-renders every second)
export const useWorkoutTick = () => {
    const context = useContext(WorkoutTickContext);
    if (!context) {
        throw new Error("useWorkoutTick must be used within a WorkoutTimerProvider");
    }
    return context;
};
