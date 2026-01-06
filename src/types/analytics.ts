import { Timestamp } from "firebase/firestore";

/**
 * Represents a personal record for a specific exercise
 */
export interface PersonalRecord {
    exerciseName: string;
    exerciseKey: string;      // Lowercase normalized key for comparison
    weight: number;           // kg
    reps: number;
    volume: number;           // weight * reps (for easy comparison)
    achievedAt: Timestamp;
}

/**
 * Training day entry for consistency tracking
 * Stored as array of date strings (YYYY-MM-DD) for last 90 days
 */
export type TrainingDates = string[];

/**
 * User analytics summary stored in Firestore
 * Collection: user_analytics/{userId}
 * 
 * DESIGN: Incremental updates only - never recalculates from scratch
 * Each workout adds to these values rather than replacing them.
 */
export interface UserAnalyticsSummary {
    userId: string;

    // Cumulative stats (incremented on each workout)
    totalVolume: number;                    // Total kg lifted all-time
    totalWorkouts: number;                  // Total number of workouts completed

    // Personal records (only updated if new PR achieved)
    personalRecords: PersonalRecord[];      // Best lifts per exercise (max ~50)

    // Consistency tracking (rolling window)
    trainingDates: TrainingDates;           // Last 90 days of training dates
    consistencyScore: number;               // 0-100 based on training frequency

    // Timestamps
    lastTrainingDate: Timestamp | null;     // When the user last trained
    updatedAt: Timestamp;                   // Last time this document was updated
}

/**
 * Input for incremental analytics update
 * Contains only the data from the NEW workout
 */
export interface WorkoutAnalyticsInput {
    sessionVolume: number;                  // Volume of this workout only
    exerciseMaxes: {                        // Best set per exercise in this workout
        exerciseName: string;
        weight: number;
        reps: number;
    }[];
    trainingDate: string;                   // YYYY-MM-DD format
    performedAt: Timestamp;
}
