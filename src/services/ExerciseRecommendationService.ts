import { EXERCISE_CATALOG } from "../data/exerciseCatalog";
import { CatalogExercise } from "../types/exercise";

export const ExerciseRecommendationService = {
    /**
     * Get substitute recommendations for a given exercise
     * Logic:
     * 1. Must share at least one primary muscle
     * 2. Should preferably match mechanic (compound vs isolation)
     * 3. Should preferably match force type (push vs pull)
     */
    getRecommendedSubstitutes: (originalExerciseId: string | undefined): CatalogExercise[] => {
        if (!originalExerciseId) return [];

        const original = EXERCISE_CATALOG.find(e => e.id === originalExerciseId);
        if (!original) return [];

        return EXERCISE_CATALOG.filter(exercise => {
            // Don't recommend itself
            if (exercise.id === original.id) return false;

            // 1. Must share at least one primary muscle
            const hasMuscleOverlap = exercise.primaryMuscles.some(m =>
                original.primaryMuscles.includes(m)
            );
            if (!hasMuscleOverlap) return false;

            // 2. Score match quality
            let score = 0;

            // Mechanic match (High priority)
            if (exercise.mechanic === original.mechanic) score += 3;

            // Force type match (Medium priority)
            if (exercise.force === original.force) score += 2;

            // Equipment variety (Optional: maybe prioritize DIFFERENT equipment?)
            // For now, we treat same equipment as neutral.

            return score >= 3; // Strict filter for "Recommendations"
        }).sort((a, b) => {
            // Sort by relevance (mechanic + force match first)
            const scoreA = (a.mechanic === original.mechanic ? 3 : 0) + (a.force === original.force ? 2 : 0);
            const scoreB = (b.mechanic === original.mechanic ? 3 : 0) + (b.force === original.force ? 2 : 0);
            return scoreB - scoreA;
        });
    }
};
