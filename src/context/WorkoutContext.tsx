import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Routine, RoutineExercise } from "../types/routine";
import { WorkoutSetLog } from "../types/workout";

interface ActiveWorkout {
    routine: Routine;
    dayIndex: number;
    startTime: number; // Timestamp
    logs: Record<string, WorkoutSetLog[]>; // exerciseId -> sets
    completedSets: Set<string>; // "exerciseId-setIndex"
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
    // Proxied from Timer Context for convenience, or removed?
    // Let's remove them to force clean separation. Consumers should use useWorkoutTimerContext.
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

// Moved hooks to WorkoutTimerContext or logic within provider
// Removing useWorkoutTimer and useRestTimer exports from here

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
    const { setStartTime, startRest, stopRest, isResting } = useWorkoutTimerContext();

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
        setActiveWorkout({
            routine,
            dayIndex,
            startTime: now,
            logs: initialLogs,
            completedSets: new Set(),
        });
        setStartTime(now); // Sync with Timer Context
    }, [setStartTime]);

    const cancelWorkout = useCallback(() => {
        setActiveWorkout(null);
        setStartTime(null);
        stopRest();
    }, [setStartTime, stopRest]);

    const finishWorkout = useCallback(() => {
        setActiveWorkout(null);
        setStartTime(null);
        stopRest();
    }, [setStartTime, stopRest]);

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
        replaceExercise,
        reorderExercises,
        addExerciseToSession,
        removeExerciseFromSession
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
