import { Timestamp } from "firebase/firestore";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

export interface RoutineExercise {
    id: string;                  // UUID generated with uuidv4()
    exerciseId?: string;         // Future: catalog reference
    name: string;
    sets: number;
    reps: string;                // Flexible: "8-12", "AMRAP", etc.
    restSeconds: number;
    notes?: string;
    order: number;
}

export interface RoutineDay {
    dayIndex: number;            // 0-6
    label: string;               // "Pecho / Tríceps"
    exercises: RoutineExercise[];
}

export interface Routine {
    id: string;                  // Firestore doc ID
    userId: string;
    name: string;
    source: "manual" | "ai";
    isActive: boolean;
    daysPerWeek: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    days: RoutineDay[];
}

// Editor state (not saved to Firestore directly)
export interface RoutineDraft {
    name: string;
    days: RoutineDay[];
}

// Helper for creating empty structures
export const createEmptyExercise = (order: number): RoutineExercise => ({
    id: uuidv4(),
    name: "",
    sets: 3,
    reps: "8-12",
    restSeconds: 90,
    order,
});

export const createEmptyDay = (dayIndex: number): RoutineDay => ({
    dayIndex,
    label: `Día ${dayIndex + 1}`,
    exercises: [],
});

export const createEmptyDraft = (): RoutineDraft => ({
    name: "",
    days: Array.from({ length: 7 }, (_, i) => createEmptyDay(i)),
});
