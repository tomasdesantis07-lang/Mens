import { Mechanic } from "../types/exercise";

export interface RepRangeResult {
    min: number;
    max: number;
    label: string; // "8-12", "12-15", etc.
}

/**
 * Calculates the target repetition range based on user level, goal, and exercise type.
 */
export const calculateRepRange = (
    mechanic: Mechanic
): RepRangeResult => {
    let min: number;
    let max: number;

    // Standard Hypertrophy/Recomp Logic
    if (mechanic === 'compound') {
        min = 6;
        max = 10;
    } else {
        min = 10;
        max = 15;
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
