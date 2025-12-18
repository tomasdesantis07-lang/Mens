import { Timestamp } from "firebase/firestore";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

export interface PredefinedSet {
    setIndex: number;
    targetWeight?: number;  // Optional preset
    targetReps?: number;    // Optional preset
}

import { BodyZone } from "./exercise";

export interface RoutineExercise {
    id: string;                  // UUID generated with uuidv4()
    exerciseId?: string;         // Catalog reference
    targetZone?: BodyZone;       // Cached zone for quick access
    name: string;
    sets: PredefinedSet[];       // Changed from number to array
    reps: string;                // Flexible: "8-12", "AMRAP", etc. (kept for reference)
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
    isCurrentPlan: boolean;      // Only one routine can be the current plan
    isGeneratedForUser?: boolean; // True if generated during onboarding "For You"
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
export const createEmptySet = (setIndex: number): PredefinedSet => ({
    setIndex,
    targetWeight: undefined,
    targetReps: undefined,
});

export const createEmptyExercise = (order: number): RoutineExercise => ({
    id: uuidv4(),
    name: "",
    sets: [
        createEmptySet(0),
        createEmptySet(1),
        createEmptySet(2),
    ],
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
