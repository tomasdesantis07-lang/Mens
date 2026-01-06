import { Timestamp } from "firebase/firestore";

export interface WorkoutSetLog {
    setIndex: number;   // 1, 2, 3, ...
    weight: number;     // kg used in that set
    reps: number;       // reps actually performed
    rir?: number;       // optional, reserved for the future
}

export interface WorkoutExerciseLog {
    exerciseId?: string;         // link to catalog if available
    routineExerciseId: string;   // id of the RoutineExercise in the routine template
    name: string;                // snapshot of exercise name
    targetSets: number;          // copy of RoutineExercise.sets
    targetReps: string;          // copy of RoutineExercise.reps
    sets: WorkoutSetLog[];       // what the user actually did
}

export interface WorkoutSession {
    id: string;                  // Firestore doc ID
    userId: string;
    routineId: string;
    routineName: string;         // snapshot (so if the routine name changes later, the log still shows old name)
    dayIndex: number;            // which day of the routine this session used
    performedAt: Timestamp;      // Firestore Timestamp
    durationSeconds: number;     // Real workout duration in seconds (HH:MM:SS = durationSeconds)
    notes?: string;
    exercises: WorkoutExerciseLog[];
}
