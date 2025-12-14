import { isWithinInterval, startOfWeek, subWeeks } from "date-fns";
import { collection, getDocs, query, Timestamp, where } from "firebase/firestore";
import { EXERCISE_CATALOG } from "../data/exerciseCatalog";
import { WorkoutSession } from "../types/workout";
import { db } from "./firebaseConfig";

export interface MuscleDistribution {
    targetZone: string;
    volume: number;
    percentage: number;
}

export interface VolumeDataPoint {
    label: string;
    value: number;
    week: number;
}

export interface UserRank {
    percentile: number;
    label: string;
    nextRankThreshold: number;
}

export const StatsService = {
    /**
     * Analyzes workout history and returns volume distribution by target zone
     * @param userId - User ID to analyze
     * @returns Array of muscle groups with volume and percentage
     */
    async getMuscleDistribution(userId: string): Promise<MuscleDistribution[]> {
        try {
            const sessionsRef = collection(db, "workoutSessions");
            const q = query(sessionsRef, where("userId", "==", userId));
            const querySnapshot = await getDocs(q);

            // Aggregate volume by target zone
            const volumeByZone: Record<string, number> = {};
            let totalVolume = 0;

            querySnapshot.forEach((doc) => {
                const session = doc.data() as WorkoutSession;

                session.exercises.forEach((exercise) => {
                    // Try to find targetZone from catalog if not in exercise log
                    let targetZone = "Unknown";
                    if (exercise.exerciseId) {
                        const catalogExercise = EXERCISE_CATALOG.find(e => e.id === exercise.exerciseId);
                        if (catalogExercise) {
                            targetZone = catalogExercise.targetZone;
                        }
                    }

                    const exerciseVolume = exercise.sets.reduce((sum, set) => {
                        const weight = typeof set.weight === 'string' ? parseFloat(set.weight) : set.weight;
                        const reps = typeof set.reps === 'string' ? parseInt(set.reps) : set.reps;
                        return sum + ((weight || 0) * (reps || 0));
                    }, 0);

                    volumeByZone[targetZone] = (volumeByZone[targetZone] || 0) + exerciseVolume;
                    totalVolume += exerciseVolume;
                });
            });

            // Convert to array with percentages
            const distribution: MuscleDistribution[] = Object.entries(volumeByZone)
                .map(([targetZone, volume]) => ({
                    targetZone,
                    volume,
                    percentage: totalVolume > 0 ? (volume / totalVolume) * 100 : 0,
                }))
                .sort((a, b) => b.volume - a.volume);

            return distribution;
        } catch (error) {
            console.error("Error getting muscle distribution:", error);
            throw error;
        }
    },

    /**
     * Returns weekly volume progression for the specified number of weeks
     * @param userId - User ID to analyze
     * @param weeks - Number of weeks to analyze (default: 12)
     * @returns Array of data points for chart
     */
    async getVolumeProgression(userId: string, weeks: number = 12): Promise<VolumeDataPoint[]> {
        try {
            const sessionsRef = collection(db, "workoutSessions");
            const q = query(sessionsRef, where("userId", "==", userId));
            const querySnapshot = await getDocs(q);

            const now = new Date();
            const weeklyVolumes: Record<number, number> = {};

            // Initialize all weeks with 0
            for (let i = 0; i < weeks; i++) {
                weeklyVolumes[i] = 0;
            }

            querySnapshot.forEach((doc) => {
                const session = doc.data() as WorkoutSession;
                const performedAt = (session.performedAt as Timestamp)?.toDate();

                if (!performedAt) return;

                // Calculate which week this session belongs to
                for (let weekIndex = 0; weekIndex < weeks; weekIndex++) {
                    const weekStart = startOfWeek(subWeeks(now, weeks - 1 - weekIndex), { weekStartsOn: 1 });
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 6);

                    if (isWithinInterval(performedAt, { start: weekStart, end: weekEnd })) {
                        const sessionVolume = session.exercises.reduce((total, exercise) => {
                            const exerciseVolume = exercise.sets.reduce((sum, set) => {
                                const weight = typeof set.weight === 'string' ? parseFloat(set.weight) : set.weight;
                                const reps = typeof set.reps === 'string' ? parseInt(set.reps) : set.reps;
                                return sum + ((weight || 0) * (reps || 0));
                            }, 0);
                            return total + exerciseVolume;
                        }, 0);

                        weeklyVolumes[weekIndex] += sessionVolume;
                        break;
                    }
                }
            });

            // Convert to array format for chart
            return Array.from({ length: weeks }, (_, i) => {
                const weekStart = startOfWeek(subWeeks(now, weeks - 1 - i), { weekStartsOn: 1 });
                return {
                    label: `S${i + 1}`,
                    value: Math.round(weeklyVolumes[i]),
                    week: i + 1,
                };
            });
        } catch (error) {
            console.error("Error getting volume progression:", error);
            throw error;
        }
    },

    /**
     * Calculates user's consistency rank (simulated for MVP)
     * @param userId - User ID to analyze
     * @returns Rank information with percentile and label
     */
    async getUserRank(userId: string): Promise<UserRank> {
        try {
            const sessionsRef = collection(db, "workoutSessions");
            const q = query(sessionsRef, where("userId", "==", userId));
            const querySnapshot = await getDocs(q);

            const totalWorkouts = querySnapshot.size;

            if (totalWorkouts === 0) {
                return {
                    percentile: 100,
                    label: "Beginner",
                    nextRankThreshold: 5,
                };
            }

            // Calculate days since first workout
            let firstWorkoutDate: Date | null = null;
            let lastWorkoutDate: Date | null = null;

            querySnapshot.forEach((doc) => {
                const session = doc.data() as WorkoutSession;
                const performedAt = (session.performedAt as Timestamp)?.toDate();

                if (!performedAt) return;

                if (!firstWorkoutDate || performedAt < firstWorkoutDate) {
                    firstWorkoutDate = performedAt;
                }
                if (!lastWorkoutDate || performedAt > lastWorkoutDate) {
                    lastWorkoutDate = performedAt;
                }
            });

            if (!firstWorkoutDate || !lastWorkoutDate) {
                return {
                    percentile: 100,
                    label: "Beginner",
                    nextRankThreshold: 5,
                };
            }

            const start = firstWorkoutDate as Date;
            const end = lastWorkoutDate as Date;

            const daysSinceStart = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
            const workoutsPerWeek = (totalWorkouts / daysSinceStart) * 7;

            // Simulated ranking based on frequency
            let percentile: number;
            let label: string;
            let nextRankThreshold: number;

            if (workoutsPerWeek >= 5) {
                percentile = 5;
                label = "Elite";
                nextRankThreshold = 1;
            } else if (workoutsPerWeek >= 4) {
                percentile = 10;
                label = "Advanced";
                nextRankThreshold = 5;
            } else if (workoutsPerWeek >= 3) {
                percentile = 20;
                label = "Intermediate";
                nextRankThreshold = 10;
            } else if (workoutsPerWeek >= 2) {
                percentile = 40;
                label = "Regular";
                nextRankThreshold = 20;
            } else {
                percentile = 70;
                label = "Beginner";
                nextRankThreshold = 40;
            }

            return {
                percentile,
                label,
                nextRankThreshold,
            };
        } catch (error) {
            console.error("Error getting user rank:", error);
            throw error;
        }
    },

    /**
     * Calculates heatmap intensity data for body muscles
     * @param history - Array of workout sessions
     * @returns Object mapping muscle IDs to intensity (0-1)
     */
    calculateHeatmapData(history: WorkoutSession[]): Record<string, number> {
        const muscleVolume: Record<string, number> = {};
        let maxVolume = 0;

        history.forEach(session => {
            session.exercises.forEach(exercise => {
                // Find exercise in catalog to get primary muscles
                const catalogExercise = EXERCISE_CATALOG.find(e => e.id === exercise.exerciseId);
                if (!catalogExercise?.primaryMuscles) return;

                const volume = exercise.sets.reduce((sum, set) => {
                    const weight = typeof set.weight === 'string' ? parseFloat(set.weight) : set.weight;
                    const reps = typeof set.reps === 'string' ? parseInt(set.reps) : set.reps;
                    return sum + ((weight || 0) * (reps || 0));
                }, 0);

                catalogExercise.primaryMuscles.forEach(muscle => {
                    muscleVolume[muscle] = (muscleVolume[muscle] || 0) + volume;
                });
            });
        });

        // Find max volume to normalize
        Object.values(muscleVolume).forEach(vol => {
            if (vol > maxVolume) maxVolume = vol;
        });

        // Normalize to 0-1
        const heatmapData: Record<string, number> = {};
        Object.keys(muscleVolume).forEach(muscle => {
            heatmapData[muscle] = maxVolume > 0 ? muscleVolume[muscle] / maxVolume : 0;
        });

        return heatmapData;
    }
};
