import React, { createContext, useContext, useEffect, useState } from "react";

interface WorkoutTimerContextType {
    elapsedTime: number;
    restRemaining: number;
    startRest: (seconds: number) => void;
    stopRest: () => void;
    setStartTime: (startTime: number | null) => void;
    isResting: boolean;
}

const WorkoutTimerContext = createContext<WorkoutTimerContextType | undefined>(undefined);

export const WorkoutTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [elapsedTime, setElapsedTime] = useState(0);
    const [startTime, setStartTimeState] = useState<number | null>(null);

    const [restEndTime, setRestEndTime] = useState<number | null>(null);
    const [restRemaining, setRestRemaining] = useState(0);

    // Workout Timer Logic
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

    // Rest Timer Logic
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

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [restEndTime]);

    const startRest = (seconds: number) => {
        setRestEndTime(Date.now() + seconds * 1000);
    };

    const stopRest = () => {
        setRestEndTime(null);
        setRestRemaining(0);
    };

    const setStartTime = (time: number | null) => {
        setStartTimeState(time);
    };

    return (
        <WorkoutTimerContext.Provider value={{
            elapsedTime,
            restRemaining,
            startRest,
            stopRest,
            setStartTime,
            isResting: !!restEndTime
        }}>
            {children}
        </WorkoutTimerContext.Provider>
    );
};

export const useWorkoutTimerContext = () => {
    const context = useContext(WorkoutTimerContext);
    if (!context) {
        throw new Error("useWorkoutTimerContext must be used within a WorkoutTimerProvider");
    }
    return context;
};
