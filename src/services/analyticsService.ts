import {
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
    Timestamp,
} from "firebase/firestore";
import { PersonalRecord, UserAnalyticsSummary, WorkoutAnalyticsInput } from "../types/analytics";
import { WorkoutSession } from "../types/workout";
import { db } from "./firebaseConfig";

/**
 * Analytics Service - INCREMENTAL DESIGN
 * 
 * This service uses incremental updates for O(1) complexity regardless of
 * how many workouts a user has. Each workout only adds its own contribution
 * to the existing analytics rather than recalculating everything.
 * 
 * Scalability: Works efficiently for users with 10 or 10,000 workouts.
 */
export const AnalyticsService = {
    /**
     * Extract analytics input from a workout session
     * This is O(exercises * sets) - typically very small
     */
    extractWorkoutInput(session: WorkoutSession): WorkoutAnalyticsInput {
        let sessionVolume = 0;
        const exerciseMaxes: WorkoutAnalyticsInput["exerciseMaxes"] = [];

        for (const exercise of session.exercises) {
            let bestVolume = 0;
            let bestWeight = 0;
            let bestReps = 0;

            for (const set of exercise.sets) {
                const setVolume = set.weight * set.reps;
                sessionVolume += setVolume;

                // Track best set for this exercise (by volume)
                if (setVolume > bestVolume) {
                    bestVolume = setVolume;
                    bestWeight = set.weight;
                    bestReps = set.reps;
                }
            }

            if (bestVolume > 0) {
                exerciseMaxes.push({
                    exerciseName: exercise.name,
                    weight: bestWeight,
                    reps: bestReps,
                });
            }
        }

        // Get training date in YYYY-MM-DD format
        const trainingDate = session.performedAt?.toDate?.()
            ? session.performedAt.toDate().toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0];

        return {
            sessionVolume,
            exerciseMaxes,
            trainingDate,
            performedAt: session.performedAt || Timestamp.now(),
        };
    },

    /**
     * Calculate consistency score from training dates
     * Efficiently calculates from the stored array (O(n) where n <= 90)
     */
    calculateConsistencyFromDates(trainingDates: string[], daysToAnalyze: number = 30): number {
        if (trainingDates.length === 0) return 0;

        const now = new Date();
        const cutoffDate = new Date(now.getTime() - daysToAnalyze * 24 * 60 * 60 * 1000);
        const cutoffStr = cutoffDate.toISOString().split("T")[0];

        // Count unique days within the analysis period
        const recentDays = new Set(
            trainingDates.filter(date => date >= cutoffStr)
        );

        // Score: (actual days / ideal days) * 100, capped at 100
        // Ideal = ~4.5 days/week
        const idealDays = Math.round((daysToAnalyze / 7) * 4.5);
        return Math.min(100, Math.round((recentDays.size / idealDays) * 100));
    },

    /**
     * Merge new PRs with existing PRs
     * Only updates if the new lift has higher volume
     */
    mergePRs(
        existingPRs: PersonalRecord[],
        newMaxes: WorkoutAnalyticsInput["exerciseMaxes"],
        performedAt: Timestamp
    ): PersonalRecord[] {
        const prMap = new Map<string, PersonalRecord>();

        // Add existing PRs to map
        for (const pr of existingPRs) {
            prMap.set(pr.exerciseKey, pr);
        }

        // Check new maxes against existing PRs
        for (const newMax of newMaxes) {
            const key = newMax.exerciseName.toLowerCase().trim();
            const newVolume = newMax.weight * newMax.reps;
            const existing = prMap.get(key);

            if (!existing || newVolume > existing.volume) {
                prMap.set(key, {
                    exerciseName: newMax.exerciseName,
                    exerciseKey: key,
                    weight: newMax.weight,
                    reps: newMax.reps,
                    volume: newVolume,
                    achievedAt: performedAt,
                });
            }
        }

        // Convert back to array, sorted by volume descending
        return Array.from(prMap.values()).sort((a, b) => b.volume - a.volume);
    },

    /**
     * Prune old training dates (keep only last 90 days)
     */
    pruneTrainingDates(dates: string[]): string[] {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 90);
        const cutoffStr = cutoff.toISOString().split("T")[0];

        return dates.filter(date => date >= cutoffStr);
    },

    /**
     * INCREMENTAL UPDATE - Main method
     * 
     * Complexity: O(1) for volume, O(exercises) for PRs, O(90) for consistency
     * Does NOT fetch all workout sessions - only uses the new workout data
     */
    async updateUserAnalyticsIncremental(
        userId: string,
        workoutInput: WorkoutAnalyticsInput
    ): Promise<void> {
        try {
            console.log("[Analytics] Starting incremental update for user:", userId);

            // 1. Fetch current analytics (single doc read)
            const analyticsRef = doc(db, "user_analytics", userId);
            const docSnap = await getDoc(analyticsRef);

            let currentAnalytics: Partial<UserAnalyticsSummary> = {};
            if (docSnap.exists()) {
                currentAnalytics = docSnap.data() as UserAnalyticsSummary;
            }

            // 2. Increment total volume (O(1))
            const newTotalVolume = (currentAnalytics.totalVolume || 0) + workoutInput.sessionVolume;
            const newTotalWorkouts = (currentAnalytics.totalWorkouts || 0) + 1;

            // 3. Update training dates (O(90) max)
            let trainingDates = [...(currentAnalytics.trainingDates || [])];
            if (!trainingDates.includes(workoutInput.trainingDate)) {
                trainingDates.push(workoutInput.trainingDate);
            }
            trainingDates = this.pruneTrainingDates(trainingDates);

            // 4. Calculate consistency from dates (O(90))
            const consistencyScore = this.calculateConsistencyFromDates(trainingDates, 30);

            // 5. Merge PRs (O(exercises * existingPRs))
            const newPRs = this.mergePRs(
                currentAnalytics.personalRecords || [],
                workoutInput.exerciseMaxes,
                workoutInput.performedAt
            );

            // 6. Build updated analytics
            const updatedAnalytics: Omit<UserAnalyticsSummary, "updatedAt"> = {
                userId,
                totalVolume: newTotalVolume,
                totalWorkouts: newTotalWorkouts,
                personalRecords: newPRs,
                trainingDates,
                consistencyScore,
                lastTrainingDate: workoutInput.performedAt,
            };

            // 7. Save to Firestore (single doc write)
            await setDoc(analyticsRef, {
                ...updatedAnalytics,
                updatedAt: serverTimestamp(),
            });

            console.log("[Analytics] Incremental update complete:", {
                totalVolume: newTotalVolume,
                totalWorkouts: newTotalWorkouts,
                consistencyScore,
                prsCount: newPRs.length,
                sessionVolume: workoutInput.sessionVolume,
            });

        } catch (error) {
            console.error("[Analytics] Error in incremental update:", error);
        }
    },

    /**
     * Update analytics from a WorkoutSession object
     * Convenience wrapper that extracts input and calls incremental update
     */
    async updateFromSession(userId: string, session: WorkoutSession): Promise<void> {
        const input = this.extractWorkoutInput(session);
        await this.updateUserAnalyticsIncremental(userId, input);
    },

    /**
     * Get current analytics summary for a user
     */
    async getUserAnalytics(userId: string): Promise<UserAnalyticsSummary | null> {
        try {
            const analyticsRef = doc(db, "user_analytics", userId);
            const docSnap = await getDoc(analyticsRef);

            if (docSnap.exists()) {
                return docSnap.data() as UserAnalyticsSummary;
            }

            return null;
        } catch (error) {
            console.error("[Analytics] Error fetching user analytics:", error);
            return null;
        }
    },

    /**
     * Recalculate user analytics from scratch
     * Must be called when sessions are modified (edited) or deleted
     */
    async recalculateUserAnalytics(userId: string): Promise<void> {
        try {
            console.log("[Analytics] Recalculating all analytics for user:", userId);

            // Import WorkoutService dynamically to avoid circular dependency
            const { WorkoutService } = await import("./workoutService");

            // 1. Fetch ALL user sessions
            // This is heavy set, but necessary for correctness after mutation
            const allSessions = await WorkoutService.getAllUserWorkoutSessions(userId);

            // 2. Rebuild state from scratch
            let totalVolume = 0;
            let totalWorkouts = 0;
            let trainingDates: string[] = [];
            let personalRecords: PersonalRecord[] = [];

            // Sort sessions by date ascending to process chronologically
            const sortedSessions = allSessions.sort((a: any, b: any) =>
                (a.performedAt?.toMillis() || 0) - (b.performedAt?.toMillis() || 0)
            );

            for (const session of sortedSessions) {
                const input = this.extractWorkoutInput(session);

                totalVolume += input.sessionVolume;
                totalWorkouts++;

                if (!trainingDates.includes(input.trainingDate)) {
                    trainingDates.push(input.trainingDate);
                }

                // Re-merge PRs incrementally
                personalRecords = this.mergePRs(
                    personalRecords,
                    input.exerciseMaxes,
                    input.performedAt
                );
            }

            // 3. Prune dates and calc consistency
            trainingDates = this.pruneTrainingDates(trainingDates);
            const consistencyScore = this.calculateConsistencyFromDates(trainingDates, 30);

            // 4. Build final object
            const analyticsRef = doc(db, "user_analytics", userId);
            const updatedAnalytics: Omit<UserAnalyticsSummary, "updatedAt"> = {
                userId,
                totalVolume,
                totalWorkouts,
                personalRecords,
                trainingDates,
                consistencyScore,
                lastTrainingDate: sortedSessions.length > 0
                    ? sortedSessions[sortedSessions.length - 1].performedAt
                    : Timestamp.now(),
            };

            // 5. Save (OVERWRITE)
            await setDoc(analyticsRef, {
                ...updatedAnalytics,
                updatedAt: serverTimestamp(),
            });

            console.log("[Analytics] Recalculation complete. Total workouts:", totalWorkouts);

        } catch (error) {
            console.error("[Analytics] Error recalculating analytics:", error);
        }
    }
};
