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
                max = 20;
            }
            break;
        default:
            // Fallback to Recomposition
            min = 8;
            max = 12;
    }

    // Novato Filter: Safety Floor
    if (userLevel === 'Novato') {
        if (min < 5) min = 5;
        if (max < 5) max = 5;
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
    rpe: number = 10
): boolean => {
    return repsPerformed >= targetMax;
};
