import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { workoutStorage } from "../storage/mmkv";
import { Routine, RoutineExercise } from "../types/routine";
import { WorkoutSetLog } from "../types/workout";

interface ActiveWorkout {
    routine: Routine;
    dayIndex: number;
    startTime: number; // Timestamp
    logs: Record<string, WorkoutSetLog[]>; // exerciseId -> sets
    completedSets: Set<string>; // "exerciseId-setIndex"
    isMinimized: boolean;
}

import { useWorkoutTimerContext } from "./WorkoutTimerContext";

// ... existing interfaces ...

interface WorkoutContextType {
    activeWorkout: ActiveWorkout | null;
    startWorkout: (routine: Routine, dayIndex: number) => void;
    cancelWorkout: () => void;
    finishWorkout: () => void;
    logSet: (exerciseId: string, setIndex: number, field: "weight" | "reps", value: number) => void;
    toggleSetComplete: (exerciseId: string, setIndex: number) => void;
    addSet: (exerciseId: string) => void;
    removeSet: (exerciseId: string, setIndex: number) => void;
    replaceExercise: (oldExerciseId: string, newExerciseData: { id: string; name: string; targetZone?: any }) => void;
    reorderExercises: (orderedIds: string[]) => void;
    addExerciseToSession: (exercise: RoutineExercise) => void;
    removeExerciseFromSession: (exerciseId: string) => void;
    setIsMinimized: (minimized: boolean) => void;
    // Proxied from Timer Context for convenience, or removed?
    // Let's remove them to force clean separation. Consumers should use useWorkoutTimerContext.
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

// Moved hooks to WorkoutTimerContext or logic within provider
// Removing useWorkoutTimer and useRestTimer exports from here

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
    const { setStartTime, startRest, stopRest, isResting } = useWorkoutTimerContext();
    const saveTimeout = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Debounced persistence to avoid blocking UI with JSON.stringify on every tap
    const persistState = useCallback((state: ActiveWorkout | null) => {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => {
            if (state) {
                workoutStorage.saveActiveWorkout(state);
            } else {
                workoutStorage.clearActiveWorkout();
            }
        }, 300); // 300ms debounce
    }, []);

    const startWorkout = useCallback((routine: Routine, dayIndex: number) => {
        // Initialize logs based on the routine day
        const day = routine.days.find(d => d.dayIndex === dayIndex);
        const initialLogs: Record<string, WorkoutSetLog[]> = {};

        if (day) {
            day.exercises.forEach(ex => {
                initialLogs[ex.id] = ex.sets.map((set) => ({
                    setIndex: set.setIndex,
                    weight: set.targetWeight || 0,
                    reps: set.targetReps || 0,
                }));
            });
        }

        const now = Date.now();
        const newState = {
            routine,
            dayIndex,
            startTime: now,
            logs: initialLogs,
            completedSets: new Set<string>(),
            isMinimized: false,
        };

        setActiveWorkout(newState);
        persistState(newState); // First save
        setStartTime(now); // Sync with Timer Context
    }, [setStartTime, persistState]);

    const cancelWorkout = useCallback(() => {
        setActiveWorkout(null);
        persistState(null);
        setStartTime(null);
        stopRest();
    }, [setStartTime, stopRest, persistState]);

    const finishWorkout = useCallback(() => {
        setActiveWorkout(null);
        persistState(null);
        setStartTime(null);
        stopRest();
    }, [setStartTime, stopRest, persistState]);

    const logSet = useCallback((exerciseId: string, setIndex: number, field: "weight" | "reps", value: number) => {
        setActiveWorkout(prev => {
            if (!prev) return null;
            const currentSets = prev.logs[exerciseId] ? [...prev.logs[exerciseId]] : [];
            const setIdx = currentSets.findIndex(s => s.setIndex === setIndex);

            if (setIdx !== -1) {
                currentSets[setIdx] = { ...currentSets[setIdx], [field]: value };
            }

            const nextState = { ...prev, logs: { ...prev.logs, [exerciseId]: currentSets } };
            persistState(nextState);
            return nextState;
        });
    }, [persistState]);

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
            const nextState = { ...prev, completedSets: nextCompleted };
            persistState(nextState);
            return nextState;
        });
    }, [persistState]);

    const addSet = useCallback((exerciseId: string) => {
        setActiveWorkout(prev => {
            if (!prev) return null;
            const currentSets = prev.logs[exerciseId] ? [...prev.logs[exerciseId]] : [];
            const nextIndex = currentSets.length > 0
                ? Math.max(...currentSets.map(s => s.setIndex)) + 1
                : 1;

            const nextState = {
                ...prev,
                logs: {
                    ...prev.logs,
                    [exerciseId]: [...currentSets, { setIndex: nextIndex, weight: 0, reps: 0 }]
                }
            };
            persistState(nextState);
            return nextState;
        });
    }, [persistState]);

    const removeSet = useCallback((exerciseId: string, setIndex: number) => {
        setActiveWorkout(prev => {
            if (!prev) return null;
            const currentSets = prev.logs[exerciseId] ? [...prev.logs[exerciseId]] : [];
            const nextState = {
                ...prev,
                logs: {
                    ...prev.logs,
                    [exerciseId]: currentSets.filter(s => s.setIndex !== setIndex)
                }
            };
            persistState(nextState);
            return nextState;
        });
    }, [persistState]);

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

            const nextState = {
                ...prev,
                routine: updatedRoutine,
                logs: {
                    ...prev.logs,
                    [exerciseId]: newLogs
                },
                completedSets: nextCompleted
            };
            persistState(nextState);
            return nextState;
        });
    }, [persistState]);

    const reorderExercises = useCallback((orderedIds: string[]) => {
        setActiveWorkout(prev => {
            if (!prev) return null;

            const updatedRoutine = { ...prev.routine };
            const days = [...updatedRoutine.days];
            const dayIndexInRoutine = days.findIndex(d => d.dayIndex === prev.dayIndex);

            if (dayIndexInRoutine === -1) return prev;

            const updatedDay = { ...days[dayIndexInRoutine] };
            const currentExercises = [...updatedDay.exercises];

            // Re-order exercises based on the provided ordered IDs
            const exerciseMap = new Map(currentExercises.map(e => [e.id, e]));
            const reorderedExercises = orderedIds
                .map(id => exerciseMap.get(id))
                .filter((e): e is RoutineExercise => e !== undefined);

            updatedDay.exercises = reorderedExercises;
            days[dayIndexInRoutine] = updatedDay;
            updatedRoutine.days = days;

            const nextState = {
                ...prev,
                routine: updatedRoutine
            };
            persistState(nextState);
            return nextState;
        });
    }, [persistState]);

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

            const nextState = {
                ...prev,
                routine: updatedRoutine,
                logs: {
                    ...prev.logs,
                    [exercise.id]: initialLogs
                }
            };
            persistState(nextState);
            return nextState;
        });
    }, [persistState]);

    const removeExerciseFromSession = useCallback((exerciseId: string) => {
        setActiveWorkout(prev => {
            if (!prev) return null;

            const updatedRoutine = { ...prev.routine };
            const days = [...updatedRoutine.days];
            const dayIndexInRoutine = days.findIndex(d => d.dayIndex === prev.dayIndex);

            if (dayIndexInRoutine === -1) return prev;
            const newLogs = { ...prev.logs };
            delete newLogs[exerciseId];

            const newState = {
                ...prev,
                routine: {
                    ...prev.routine,
                    days: prev.routine.days.map(d =>
                        d.dayIndex === prev.dayIndex
                            ? { ...d, exercises: d.exercises.filter(ex => ex.id !== exerciseId) }
                            : d
                    )
                },
                logs: newLogs
            };
            // Also remove from completedSets
            const nextCompleted = new Set(prev.completedSets);
            for (const key of nextCompleted) {
                if (key.startsWith(`${exerciseId}-`)) {
                    nextCompleted.delete(key);
                }
            }
            newState.completedSets = nextCompleted;

            persistState(newState);
            return newState;
        });
    }, [persistState]);

    const setIsMinimized = useCallback((minimized: boolean) => {
        setActiveWorkout(prev => {
            if (!prev) return null;
            if (prev.isMinimized === minimized) return prev;
            const nextState = { ...prev, isMinimized: minimized };
            persistState(nextState); // Persist the minimized state
            return nextState;
        });
    }, [persistState]);

    const contextValue = useMemo(() => ({
        activeWorkout,
        startWorkout,
        cancelWorkout,
        finishWorkout,
        logSet,
        toggleSetComplete,
        addSet,
        removeSet,
        replaceExercise,
        reorderExercises,
        addExerciseToSession,
        removeExerciseFromSession,
        setIsMinimized
    }), [
        activeWorkout,
        startWorkout,
        cancelWorkout,
        finishWorkout,
        logSet,
        toggleSetComplete,
        addSet,
        removeSet,
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
