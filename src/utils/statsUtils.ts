import { WorkoutSession } from "../types/workout";

/**
 * Calculate total volume (weight × reps × sets) for a given period
 */
export const calculateVolume = (sessions: WorkoutSession[]): {
    current: number;
    previous: number;
    percentageChange: number;
} => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    let currentWeekVolume = 0;
    let previousWeekVolume = 0;

    sessions.forEach((session) => {
        const sessionDate = session.performedAt?.toDate?.() || new Date(0);

        session.exercises.forEach((exercise) => {
            exercise.sets.forEach((set) => {
                const volume = set.weight * set.reps;

                if (sessionDate >= oneWeekAgo) {
                    currentWeekVolume += volume;
                } else if (sessionDate >= twoWeeksAgo && sessionDate < oneWeekAgo) {
                    previousWeekVolume += volume;
                }
            });
        });
    });

    const percentageChange = previousWeekVolume > 0
        ? ((currentWeekVolume - previousWeekVolume) / previousWeekVolume) * 100
        : 0;

    return {
        current: Math.round(currentWeekVolume),
        previous: Math.round(previousWeekVolume),
        percentageChange: Math.round(percentageChange),
    };
};

/**
 * Calculate consistency data for heatmap (last 90 days)
 */
export const calculateConsistency = (sessions: WorkoutSession[]): Map<string, number> => {
    const consistencyMap = new Map<string, number>();
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Initialize all days in the last 90 days with 0
    for (let i = 0; i < 90; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        consistencyMap.set(dateKey, 0);
    }

    // Count workouts per day
    sessions.forEach((session) => {
        const sessionDate = session.performedAt?.toDate?.() || new Date(0);

        if (sessionDate >= ninetyDaysAgo) {
            const dateKey = sessionDate.toISOString().split('T')[0];
            const currentCount = consistencyMap.get(dateKey) || 0;
            consistencyMap.set(dateKey, currentCount + 1);
        }
    });

    return consistencyMap;
};

/**
 * Calculate estimated 1RM using Epley formula: weight × (1 + reps/30)
 * Returns data points for the top exercise by volume
 */
export const calculateEstimated1RM = (sessions: WorkoutSession[]): {
    exerciseName: string;
    dataPoints: Array<{ date: string; value: number }>;
} => {
    // Find the exercise with the highest total volume
    const exerciseVolumes = new Map<string, number>();

    sessions.forEach((session) => {
        session.exercises.forEach((exercise) => {
            const totalVolume = exercise.sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
            const currentVolume = exerciseVolumes.get(exercise.name) || 0;
            exerciseVolumes.set(exercise.name, currentVolume + totalVolume);
        });
    });

    // Get the top exercise
    let topExercise = "";
    let maxVolume = 0;
    exerciseVolumes.forEach((volume, name) => {
        if (volume > maxVolume) {
            maxVolume = volume;
            topExercise = name;
        }
    });

    if (!topExercise) {
        return { exerciseName: "", dataPoints: [] };
    }

    // Calculate 1RM progression for the top exercise
    const dataPoints: Array<{ date: string; value: number }> = [];

    sessions.forEach((session) => {
        session.exercises.forEach((exercise) => {
            if (exercise.name === topExercise) {
                // Find the heaviest set
                let maxEstimated1RM = 0;

                exercise.sets.forEach((set) => {
                    if (set.weight > 0 && set.reps > 0) {
                        // Epley formula
                        const estimated1RM = set.weight * (1 + set.reps / 30);
                        maxEstimated1RM = Math.max(maxEstimated1RM, estimated1RM);
                    }
                });

                if (maxEstimated1RM > 0) {
                    const sessionDate = session.performedAt?.toDate?.() || new Date(0);
                    dataPoints.push({
                        date: sessionDate.toISOString().split('T')[0],
                        value: Math.round(maxEstimated1RM * 10) / 10, // Round to 1 decimal
                    });
                }
            }
        });
    });

    return {
        exerciseName: topExercise,
        dataPoints,
    };
};

/**
 * Calculate current training streak (consecutive weeks with at least 1 workout)
 */
export const calculateCurrentStreak = (sessions: WorkoutSession[]): number => {
    if (sessions.length === 0) return 0;

    const now = new Date();
    const weeksWithWorkouts = new Set<string>();

    // Group sessions by week
    sessions.forEach((session) => {
        const sessionDate = session.performedAt?.toDate?.() || new Date(0);
        const weekKey = getWeekKey(sessionDate);
        weeksWithWorkouts.add(weekKey);
    });

    // Check consecutive weeks backwards from current week
    let streak = 0;
    let currentWeek = getWeekKey(now);

    while (weeksWithWorkouts.has(currentWeek)) {
        streak++;
        // Go back one week
        const weekDate = parseWeekKey(currentWeek);
        weekDate.setDate(weekDate.getDate() - 7);
        currentWeek = getWeekKey(weekDate);
    }

    return streak;
};

/**
 * Helper: Get week key in format "YYYY-Www" (ISO week)
 */
const getWeekKey = (date: Date): string => {
    const year = date.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
};

/**
 * Helper: Parse week key back to date (Monday of that week)
 */
const parseWeekKey = (weekKey: string): Date => {
    const [yearStr, weekStr] = weekKey.split('-W');
    const year = parseInt(yearStr);
    const week = parseInt(weekStr);

    const firstDayOfYear = new Date(year, 0, 1);
    const daysToAdd = (week - 1) * 7;
    const monday = new Date(firstDayOfYear.getTime() + daysToAdd * 86400000);

    return monday;
};
