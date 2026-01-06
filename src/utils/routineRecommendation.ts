import { STARTER_TEMPLATES, StarterTemplate } from "../data/starterRoutineTemplates";

/**
 * MENS Recommendation Engine
 * Intelligently selects the best starter template based on user profile
 */

export type UserGoal = "muscle" | "fat_loss" | "strength" | "health" | "general";
export type UserLevel = "beginner" | "intermediate" | "advanced";

interface RecommendationInput {
    daysAvailable: number;
    goal: UserGoal;
    level: UserLevel;
}

/**
 * Normalizes user goals to match template goals
 * MENS prioritizes quality training over quantity
 */
const normalizeGoal = (goal: UserGoal): string => {
    switch (goal) {
        case "fat_loss":
        case "health":
            return "general";
        case "muscle":
            return "muscle";
        case "strength":
            return "strength";
        default:
            return "general";
    }
};

/**
 * Maps requested days to realistic template days
 * MENS Philosophy: Better to train less with quality than more with mediocrity
 */
const mapDaysToTemplate = (days: number, level: UserLevel): number => {
    // Now we support 2, 3, 4, 5, and 6 day templates directly
    // We respect the user's choice as the primary factor
    if (days <= 2) return 2;
    if (days >= 6) return 6;
    return days;
};

/**
 * Calculates a match score between user profile and template
 * Higher score = better match
 */
const calculateMatchScore = (
    template: StarterTemplate,
    targetDays: number,
    normalizedGoal: string,
    level: UserLevel
): number => {
    let score = 0;

    // Days match (most important factor)
    if (template.daysPerWeek === targetDays) {
        score += 100;
    } else {
        // Penalize based on distance
        const daysDiff = Math.abs(template.daysPerWeek - targetDays);
        score += Math.max(0, 100 - daysDiff * 30);
    }

    // Goal match
    if (template.recommendedGoals.includes(normalizedGoal)) {
        score += 50;
    }

    // Level match
    if (template.recommendedLevels.includes(level)) {
        score += 30;
    }

    return score;
};

/**
 * Main recommendation function
 * Returns the best template for the user's profile
 */
export const getRecommendedTemplate = (
    input: RecommendationInput
): StarterTemplate => {
    const { daysAvailable, goal, level } = input;

    // Step 1: Normalize inputs
    const normalizedGoal = normalizeGoal(goal);
    const targetDays = mapDaysToTemplate(daysAvailable, level);

    // Step 2: Calculate scores for all templates
    const scored = STARTER_TEMPLATES.map((template) => ({
        template,
        score: calculateMatchScore(template, targetDays, normalizedGoal, level),
    }));

    // Step 3: Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score);

    // Step 4: Return the best match
    return scored[0].template;
};

/**
 * Helper function to get a template by ID
 */
export const getTemplateById = (id: string): StarterTemplate | undefined => {
    return STARTER_TEMPLATES.find((t) => t.id === id);
};

/**
 * Get all available templates
 */
export const getAllTemplates = (): StarterTemplate[] => {
    return [...STARTER_TEMPLATES];
};
