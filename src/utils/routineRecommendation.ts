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
    // If user wants 1-2 days, give them 3-day fullbody
    if (days <= 2) return 3;

    // If user wants 3 days, perfect for fullbody
    if (days === 3) return 3;

    // If user wants 4-5 days
    if (days === 4 || days === 5) {
        // Beginners should stick to 3-4 days max
        if (level === "beginner") return 3;

        // Intermediates can handle 4 days
        if (level === "intermediate") return 4;

        // Advanced can go 5 days if they requested 5
        return days;
    }

    // If user wants 6+ days (MENS discourages this unless very advanced)
    if (days >= 6) {
        if (level === "beginner") return 3;
        if (level === "intermediate") return 4;
        // Even advanced users should be cautious with 6+ days
        return 5;
    }

    return 3; // Default fallback
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
