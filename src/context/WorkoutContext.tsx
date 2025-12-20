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
    restTimerDuration: number;
    isResting: boolean;
    startRestTimer: (seconds: number) => void;
    stopRestTimer: () => void;
    replaceExercise: (oldExerciseId: string, newExerciseData: { id: string; name: string; targetZone?: any }) => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

/**
 * Hook to get the elapsed workout time locally.
 * This runs its own interval to avoid re-rendering the entire context tree.
 */
export const useWorkoutTimer = (startTime: number | null): number => {
    const [elapsed, setElapsed] = useState(() =>
        startTime ? Math.floor((Date.now() - startTime) / 1000) : 0
    );

    useEffect(() => {
        if (!startTime) {
            setElapsed(0);
            return;
        }

        // Initial sync
        setElapsed(Math.floor((Date.now() - startTime) / 1000));

        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    return elapsed;
};

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
    const [restTimerDuration, setRestTimerDuration] = useState(0);
    const [isResting, setIsResting] = useState(false);

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
                // Use the PredefinedSet array to initialize logs with preset values
                initialLogs[ex.id] = ex.sets.map((set) => ({
                    setIndex: set.setIndex,
                    weight: set.targetWeight || 0,
                    reps: set.targetReps || 0,
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

    const replaceExercise = (exerciseId: string, newExerciseData: { id: string; name: string; targetZone?: any }) => {
        if (!activeWorkout) return;

        setActiveWorkout(prev => {
            if (!prev) return null;

            // 1. Clone routine to avoid direct mutation
            const updatedRoutine = { ...prev.routine };
            const days = [...updatedRoutine.days];
            const dayIndexInRoutine = days.findIndex(d => d.dayIndex === prev.dayIndex);

            if (dayIndexInRoutine === -1) return prev;

            const updatedDay = { ...days[dayIndexInRoutine] };
            const exercises = [...updatedDay.exercises];
            const exerciseIndex = exercises.findIndex(e => e.id === exerciseId);

            if (exerciseIndex === -1) return prev;

            // 2. Update exercise details
            const oldExercise = exercises[exerciseIndex];
            exercises[exerciseIndex] = {
                ...oldExercise,
                name: newExerciseData.name,
                exerciseId: newExerciseData.id,
                targetZone: newExerciseData.targetZone,
            };

            updatedDay.exercises = exercises;
            days[dayIndexInRoutine] = updatedDay;
            updatedRoutine.days = days;

            // 3. Reset performed logs (weights/reps) but keep structure
            // We want to keep the same number of sets, but clear the recorded values
            // because strict weight/reps from previous exercise likely don't apply.
            const oldLogs = prev.logs[exerciseId] || [];
            const newLogs = oldLogs.map(log => ({
                ...log,
                weight: 0,
                reps: 0
            }));

            // 4. Clear completion status for these sets
            const nextCompleted = new Set(prev.completedSets);
            oldLogs.forEach(log => {
                nextCompleted.delete(`${exerciseId}-${log.setIndex}`);
            });

            return {
                ...prev,
                routine: updatedRoutine,
                logs: {
                    ...prev.logs,
                    [exerciseId]: newLogs
                },
                completedSets: nextCompleted
            };
        });
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
            restTimerDuration,
            isResting,
            startRestTimer,
            stopRestTimer,
            replaceExercise
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
