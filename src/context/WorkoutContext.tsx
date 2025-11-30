import React, { createContext, useContext, useEffect, useState } from "react";
import { Routine } from "../types/routine";
import { WorkoutSetLog } from "../types/workout";

interface ActiveWorkout {
    routine: Routine;
    dayIndex: number;
    startTime: number; // Timestamp
    logs: Record<string, WorkoutSetLog[]>; // exerciseId -> sets
    completedSets: Set<string>; // "exerciseId-setIndex"
}

interface WorkoutContextType {
    activeWorkout: ActiveWorkout | null;
    startWorkout: (routine: Routine, dayIndex: number) => void;
    cancelWorkout: () => void;
    finishWorkout: () => void;
    logSet: (exerciseId: string, setIndex: number, field: "weight" | "reps", value: number) => void;
    toggleSetComplete: (exerciseId: string, setIndex: number) => void;
    addSet: (exerciseId: string) => void;
    removeSet: (exerciseId: string, setIndex: number) => void;
    elapsedSeconds: number;
    restTimerDuration: number;
    isResting: boolean;
    startRestTimer: (seconds: number) => void;
    stopRestTimer: () => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [restTimerDuration, setRestTimerDuration] = useState(0);
    const [isResting, setIsResting] = useState(false);

    // Global timer effect
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (activeWorkout) {
            // Update elapsed time every second
            // We calculate diff from startTime to be accurate even if backgrounded (though JS timers might pause)
            // For a robust background timer, we'd rely on AppState, but this is a good start.
            interval = setInterval(() => {
                setElapsedSeconds(Math.floor((Date.now() - activeWorkout.startTime) / 1000));
            }, 1000);
        } else {
            setElapsedSeconds(0);
        }
        return () => clearInterval(interval);
    }, [activeWorkout]);

    // Rest timer effect
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isResting && restTimerDuration > 0) {
            interval = setInterval(() => {
                setRestTimerDuration((prev) => {
                    if (prev <= 1) {
                        setIsResting(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isResting, restTimerDuration]);

    const startWorkout = (routine: Routine, dayIndex: number) => {
        // Initialize logs based on the routine day
        const day = routine.days.find(d => d.dayIndex === dayIndex);
        const initialLogs: Record<string, WorkoutSetLog[]> = {};

        if (day) {
            day.exercises.forEach(ex => {
                initialLogs[ex.id] = Array.from({ length: ex.sets }).map((_, i) => ({
                    setIndex: i + 1,
                    weight: 0,
                    reps: 0,
                }));
            });
        }

        setActiveWorkout({
            routine,
            dayIndex,
            startTime: Date.now(),
            logs: initialLogs,
            completedSets: new Set(),
        });
    };

    const cancelWorkout = () => {
        setActiveWorkout(null);
    };

    const finishWorkout = () => {
        // Logic to save is handled in the UI/Service, context just clears state
        setActiveWorkout(null);
    };

    const logSet = (exerciseId: string, setIndex: number, field: "weight" | "reps", value: number) => {
        if (!activeWorkout) return;

        setActiveWorkout(prev => {
            if (!prev) return null;
            const currentSets = prev.logs[exerciseId] ? [...prev.logs[exerciseId]] : [];
            const setIdx = currentSets.findIndex(s => s.setIndex === setIndex);

            if (setIdx !== -1) {
                currentSets[setIdx] = { ...currentSets[setIdx], [field]: value };
            }

            return { ...prev, logs: { ...prev.logs, [exerciseId]: currentSets } };
        });
    };

    const toggleSetComplete = (exerciseId: string, setIndex: number) => {
        if (!activeWorkout) return;

        setActiveWorkout(prev => {
            if (!prev) return null;
            const key = `${exerciseId}-${setIndex}`;
            const nextCompleted = new Set(prev.completedSets);
            if (nextCompleted.has(key)) {
                nextCompleted.delete(key);
            } else {
                nextCompleted.add(key);
            }
            return { ...prev, completedSets: nextCompleted };
        });
    };

    const addSet = (exerciseId: string) => {
        if (!activeWorkout) return;

        setActiveWorkout(prev => {
            if (!prev) return null;
            const currentSets = prev.logs[exerciseId] ? [...prev.logs[exerciseId]] : [];
            const nextIndex = currentSets.length > 0
                ? Math.max(...currentSets.map(s => s.setIndex)) + 1
                : 1;

            return {
                ...prev,
                logs: {
                    ...prev.logs,
                    [exerciseId]: [...currentSets, { setIndex: nextIndex, weight: 0, reps: 0 }]
                }
            };
        });
    };

    const removeSet = (exerciseId: string, setIndex: number) => {
        if (!activeWorkout) return;

        setActiveWorkout(prev => {
            if (!prev) return null;
            const currentSets = prev.logs[exerciseId] ? [...prev.logs[exerciseId]] : [];
            return {
                ...prev,
                logs: {
                    ...prev.logs,
                    [exerciseId]: currentSets.filter(s => s.setIndex !== setIndex)
                }
            };
        });
    };

    const startRestTimer = (seconds: number) => {
        setRestTimerDuration(seconds);
        setIsResting(true);
    };

    const stopRestTimer = () => {
        setIsResting(false);
        setRestTimerDuration(0);
    };

    return (
        <WorkoutContext.Provider value={{
            activeWorkout,
            startWorkout,
            cancelWorkout,
            finishWorkout,
            logSet,
            toggleSetComplete,
            addSet,
            removeSet,
            elapsedSeconds,
            restTimerDuration,
            isResting,
            startRestTimer,
            stopRestTimer
        }}>
            {children}
        </WorkoutContext.Provider>
    );
};

export const useWorkout = () => {
    const context = useContext(WorkoutContext);
    if (!context) {
        throw new Error("useWorkout must be used within a WorkoutProvider");
    }
    return context;
};
