import { CatalogExercise } from "../types/exercise";

export const EXERCISE_CATALOG: CatalogExercise[] = [
    // Chest
    { id: "chest_bench_press_bar", targetZone: "chest", equipment: "barbell" },
    { id: "chest_incline_press_dumbbells", targetZone: "chest", equipment: "dumbbell" },
    { id: "chest_pushups", targetZone: "chest", equipment: "bodyweight" },

    // Back
    { id: "back_pullups", targetZone: "back", equipment: "bodyweight" },
    { id: "back_rows_bar", targetZone: "back", equipment: "barbell" },
    { id: "back_lat_pulldown", targetZone: "back", equipment: "cable" },

    // Legs
    { id: "legs_squat_bar", targetZone: "legs", equipment: "barbell" },
    { id: "legs_leg_press", targetZone: "legs", equipment: "machine" },
    { id: "legs_lunges_dumbbells", targetZone: "legs", equipment: "dumbbell" },

    // Shoulders
    { id: "shoulders_overhead_press_bar", targetZone: "shoulders", equipment: "barbell" },
    { id: "shoulders_lateral_raises", targetZone: "shoulders", equipment: "dumbbell" },

    // Arms
    { id: "arms_bicep_curls_bar", targetZone: "arms", equipment: "barbell" },
    { id: "arms_tricep_pushdown", targetZone: "arms", equipment: "cable" },

    // Core
    { id: "core_plank", targetZone: "core", equipment: "bodyweight" },
];
