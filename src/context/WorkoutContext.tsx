import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Routine, RoutineExercise } from "../types/routine";
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
    reorderExercises: (fromIndex: number, toIndex: number) => void;
    addExerciseToSession: (exercise: RoutineExercise) => void;
    removeExerciseFromSession: (exerciseId: string) => void;
    restEndTime: number | null;
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

/**
 * Hook to get the remaining rest time locally.
 */
export const useRestTimer = (endTime: number | null): number => {
    const [remaining, setRemaining] = useState(0);

    useEffect(() => {
        if (!endTime) {
            setRemaining(0);
            return;
        }

        const update = () => {
            const diff = Math.ceil((endTime - Date.now()) / 1000);
            setRemaining(Math.max(0, diff));
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [endTime]);

    return remaining;
};

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
    const [restEndTime, setRestEndTime] = useState<number | null>(null);
    const [isResting, setIsResting] = useState(false);

    // Auto-turn off resting state when time expires
    // This uses a timeout instead of an interval, so it only triggers once at the end
    useEffect(() => {
        if (isResting && restEndTime) {
            const now = Date.now();
            const msRemaining = restEndTime - now;

            if (msRemaining <= 0) {
                setIsResting(false);
                setRestEndTime(null);
                return;
            }

            const timeout = setTimeout(() => {
                setIsResting(false);
                setRestEndTime(null);
            }, msRemaining);

            return () => clearTimeout(timeout);
        }
    }, [isResting, restEndTime]);

    const startWorkout = useCallback((routine: Routine, dayIndex: number) => {
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
    }, []);

    const cancelWorkout = useCallback(() => {
        setActiveWorkout(null);
        setRestEndTime(null);
        setIsResting(false);
    }, []);

    const finishWorkout = useCallback(() => {
        // Logic to save is handled in the UI/Service, context just clears state
        setActiveWorkout(null);
        setRestEndTime(null);
        setIsResting(false);
    }, []);

    const logSet = useCallback((exerciseId: string, setIndex: number, field: "weight" | "reps", value: number) => {
        setActiveWorkout(prev => {
            if (!prev) return null;
            const currentSets = prev.logs[exerciseId] ? [...prev.logs[exerciseId]] : [];
            const setIdx = currentSets.findIndex(s => s.setIndex === setIndex);

            if (setIdx !== -1) {
                currentSets[setIdx] = { ...currentSets[setIdx], [field]: value };
            }

            return { ...prev, logs: { ...prev.logs, [exerciseId]: currentSets } };
        });
    }, []);

    const toggleSetComplete = useCallback((exerciseId: string, setIndex: number) => {
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
    }, []);

    const addSet = useCallback((exerciseId: string) => {
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
    }, []);

    const removeSet = useCallback((exerciseId: string, setIndex: number) => {
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
    }, []);

    const startRestTimer = useCallback((seconds: number) => {
        // Set timestamp for when it ends
        setRestEndTime(Date.now() + seconds * 1000);
        setIsResting(true);
    }, []);

    const stopRestTimer = useCallback(() => {
        setIsResting(false);
        setRestEndTime(null);
    }, []);

    const replaceExercise = useCallback((exerciseId: string, newExerciseData: { id: string; name: string; targetZone?: any }) => {
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
    }, []);

    const reorderExercises = useCallback((fromIndex: number, toIndex: number) => {
        setActiveWorkout(prev => {
            if (!prev) return null;

            const updatedRoutine = { ...prev.routine };
            const days = [...updatedRoutine.days];
            const dayIndexInRoutine = days.findIndex(d => d.dayIndex === prev.dayIndex);

            if (dayIndexInRoutine === -1) return prev;

            const updatedDay = { ...days[dayIndexInRoutine] };
            const exercises = [...updatedDay.exercises];

            const [movedExercise] = exercises.splice(fromIndex, 1);
            exercises.splice(toIndex, 0, movedExercise);

            updatedDay.exercises = exercises;
            days[dayIndexInRoutine] = updatedDay;
            updatedRoutine.days = days;

            return {
                ...prev,
                routine: updatedRoutine
            };
        });
    }, []);

    const addExerciseToSession = useCallback((exercise: RoutineExercise) => {
        setActiveWorkout(prev => {
            if (!prev) return null;

            const updatedRoutine = { ...prev.routine };
            const days = [...updatedRoutine.days];
            const dayIndexInRoutine = days.findIndex(d => d.dayIndex === prev.dayIndex);

            if (dayIndexInRoutine === -1) return prev;

            const updatedDay = { ...days[dayIndexInRoutine] };
            updatedDay.exercises = [...updatedDay.exercises, exercise];

            days[dayIndexInRoutine] = updatedDay;
            updatedRoutine.days = days;

            // Initialize logs for the new exercise
            const initialLogs = exercise.sets.map((set) => ({
                setIndex: set.setIndex,
                weight: set.targetWeight || 0,
                reps: set.targetReps || 0,
            }));

            return {
                ...prev,
                routine: updatedRoutine,
                logs: {
                    ...prev.logs,
                    [exercise.id]: initialLogs
                }
            };
        });
    }, []);

    const removeExerciseFromSession = useCallback((exerciseId: string) => {
        setActiveWorkout(prev => {
            if (!prev) return null;

            const updatedRoutine = { ...prev.routine };
            const days = [...updatedRoutine.days];
            const dayIndexInRoutine = days.findIndex(d => d.dayIndex === prev.dayIndex);

            if (dayIndexInRoutine === -1) return prev;

            const updatedDay = { ...days[dayIndexInRoutine] };
            updatedDay.exercises = updatedDay.exercises.filter(e => e.id !== exerciseId);

            days[dayIndexInRoutine] = updatedDay;
            updatedRoutine.days = days;

            // Remove logs and completed status
            const newLogs = { ...prev.logs };
            delete newLogs[exerciseId];

            const nextCompleted = new Set(prev.completedSets);
            // We can't easily iterate a Set to match prefix, but it's okay to leave orphan keys
            // or we could iterate if strict cleanup is needed. For performance, leaving orphans is fine
            // as they won't match any existing exercise ID.
            // But let's do a quick cleanup for correctness if it's not too expensive.
            // Actually, simplest is to filter by checking if key starts with ID.
            for (const key of nextCompleted) {
                if (key.startsWith(`${exerciseId}-`)) {
                    nextCompleted.delete(key);
                }
            }

            return {
                ...prev,
                routine: updatedRoutine,
                logs: newLogs,
                completedSets: nextCompleted
            };
        });
    }, []);

    const contextValue = useMemo(() => ({
        activeWorkout,
        startWorkout,
        cancelWorkout,
        finishWorkout,
        logSet,
        toggleSetComplete,
        addSet,
        removeSet,
        restEndTime,
        isResting,
        startRestTimer,
        stopRestTimer,
        replaceExercise,
        reorderExercises,
        addExerciseToSession,
        removeExerciseFromSession,
        restTimerDuration: restEndTime ? Math.max(0, Math.ceil((restEndTime - Date.now()) / 1000)) : 0
    }), [
        activeWorkout,
        startWorkout,
        cancelWorkout,
        finishWorkout,
        logSet,
        toggleSetComplete,
        addSet,
        removeSet,
        restEndTime,
        isResting,
        startRestTimer,
        stopRestTimer,
        replaceExercise,
        reorderExercises,
        addExerciseToSession,
        removeExerciseFromSession
    ]);

    return (
        <WorkoutContext.Provider value={contextValue}>
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
