import { RoutineDay } from "../types/routine";

/**
 * StarterTemplate: A predefined routine structure for MENS System
 * These templates are used to recommend routines based on user profile
 */
export interface StarterTemplate {
    /** Technical identifier (e.g., "tpl_3d_fullbody") */
    id: string;

    /** i18n key for the commercial name (e.g., "routine_tpl_fundamentos") */
    nameKey: string;

    /** Number of training days per week */
    daysPerWeek: number;

    /** Recommended user levels: "beginner" | "intermediate" | "advanced" */
    recommendedLevels: string[];

    /** Recommended goals: "strength" | "muscle" | "endurance" | "general" */
    recommendedGoals: string[];

    /** Day structure with labels (exercises to be added later) */
    dayStructure: Array<{
        dayIndex: number;
        labelKey: string; // i18n key for day label
    }>;
}

/**
 * MENS System Catalog: Starter Routine Templates
 * These are the foundation of the MENS methodology
 */
export const STARTER_TEMPLATES: StarterTemplate[] = [
    // ==========================================
    // Sistema MENS: Fundamentos (Full Body)
    // ==========================================
    {
        id: "tpl_3d_fullbody",
        nameKey: "routine_tpl_fundamentos",
        daysPerWeek: 3,
        recommendedLevels: ["beginner", "intermediate"],
        recommendedGoals: ["general", "muscle", "strength"],
        dayStructure: [
            { dayIndex: 0, labelKey: "day_fullbody_a" },
            { dayIndex: 2, labelKey: "day_fullbody_b" },
            { dayIndex: 4, labelKey: "day_fullbody_c" },
        ],
    },

    // ==========================================
    // Sistema MENS: Arquitectura (Torso/Pierna)
    // ==========================================
    {
        id: "tpl_4d_upper_lower",
        nameKey: "routine_tpl_arquitectura",
        daysPerWeek: 4,
        recommendedLevels: ["intermediate", "advanced"],
        recommendedGoals: ["muscle", "strength"],
        dayStructure: [
            { dayIndex: 0, labelKey: "day_torso_a" },
            { dayIndex: 1, labelKey: "day_pierna_a" },
            { dayIndex: 3, labelKey: "day_torso_b" },
            { dayIndex: 4, labelKey: "day_pierna_b" },
        ],
    },

    // ==========================================
    // Sistema MENS: Dominio (Híbrido)
    // ==========================================
    {
        id: "tpl_5d_power_hybrid",
        nameKey: "routine_tpl_dominio",
        daysPerWeek: 5,
        recommendedLevels: ["advanced"],
        recommendedGoals: ["strength", "muscle"],
        dayStructure: [
            { dayIndex: 0, labelKey: "day_torso_fuerza" },
            { dayIndex: 1, labelKey: "day_pierna_fuerza" },
            { dayIndex: 2, labelKey: "day_empuje_hipertrofia" },
            { dayIndex: 3, labelKey: "day_traccion_hipertrofia" },
            { dayIndex: 4, labelKey: "day_pierna_hombro" },
        ],
    },
];

/**
 * Converts a StarterTemplate into actual RoutineDay objects
 * (Exercises will be empty for now - to be populated later)
 */
export const templateToRoutineDays = (template: StarterTemplate): RoutineDay[] => {
    return template.dayStructure.map(({ dayIndex, labelKey }) => ({
        dayIndex,
        label: labelKey, // The consuming code should translate this
        exercises: [],
    }));
};
