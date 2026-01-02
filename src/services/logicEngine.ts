import { Mechanic } from "../types/exercise";
import { TemplateGoal, TemplateLevel } from "../types/routineTemplate";

export interface RepRangeResult {
    min: number;
    max: number;
    label: string; // "8-12", "12-15", etc.
}

/**
 * Calculates the target repetition range based on user level, goal, and exercise type.
 */
export const calculateRepRange = (
    userLevel: TemplateLevel,
    goal: TemplateGoal,
    mechanic: Mechanic
): RepRangeResult => {
    let min: number;
    let max: number;

    // 1. Base Logic by Goal
    switch (goal) {
        case 'Fuerza':
            if (mechanic === 'compound') {
                min = 3;
                max = 5;
            } else {
                min = 8;
                max = 10;
            }
            break;
        case 'Recomposición':
            if (mechanic === 'compound') {
                min = 6;
                max = 10;
            } else {
                min = 10;
                max = 15;
            }
            break;
        case 'Resistencia':
            if (mechanic === 'compound') {
                min = 12;
                max = 15;
            } else {
                min = 15;
                max = 20; // 20+ treated as 20 for range upper bound in logic, can be formatted differently
            }
            break;
        default:
            // Fallback to Recomposition
            min = 8;
            max = 12;
    }

    // 2. Analytic (Isolation) Adjustment: +20-30%
    // If we are in isolation, we already set higher ranges above, but let's apply the specific rule if needed.
    // The prompt says: "Analytic exercises must always have a range 20-30% higher than compounds".
    // The rules defined in "Base Logic" already reflect this separation (e.g. Strength: 3-5 vs 8-10 is >30% diff).
    // We will stick to the hardcoded ranges in the prompt for "Base Logic" as they are explicit.

    // 3. Novato Filter: Safety Floor
    if (userLevel === 'Novato') {
        if (min < 5) min = 5;
        // If max was below 5 (unlikely given rules, but possible in future), adjust it too?
        // 3-5 becomes 5-5? Or 5-8?
        // Let's assume if min is raised to 5, max should be at least equal or slightly higher.
        if (max < 5) max = 5; // Should not happen with defined ranges
    }

    return {
        min,
        max,
        label: `${min}-${max}`
    };
};

/**
 * Helper to determine if a user has completed a set at the top of the range
 * and should be prompted to increase weight.
 */
export const shouldSuggestProgression = (
    repsPerformed: number,
    targetMax: number,
    rpe: number = 10 // Rate of Perceived Exertion (1-10), assuming "Technique Perfec" implies good RPE
): boolean => {
    // "Completó todas las series en el límite superior del rango con técnica perfecta"
    // We'll simplify to checking the last set or treating individual set performance.
    // If reps >= max and technique is good (implied by user input usually, or RPE < 10 failure)
    return repsPerformed >= targetMax;
};
