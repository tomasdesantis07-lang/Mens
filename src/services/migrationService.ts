import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { RoutineTemplate } from "../types/routineTemplate";
import { db } from "./firebaseConfig";

// Full dataset from user request (PLACEHOLDER - Waiting for user data)
const MOCK_TEMPLATES_DATA: RoutineTemplate[] = [
    // --- GYM ROUTINES ---
    {
        name: "routine_templates.routine_fb_3d",
        equipment: "Gym Completo",
        daysPerWeek: 3,
        days: [
            {
                id: "fb_day_1",
                name: "routine_templates.day.fb_a",
                exercises: [
                    { id: "legs_squat_bar_back", name: "exercises.legs_squat_bar_back", type: "compound", sets: 3, restSeconds: 120, targetZone: "quadriceps" },
                    { id: "chest_incline_press_bar", name: "exercises.chest_incline_press_bar", type: "compound", sets: 3, restSeconds: 90, targetZone: "chest" },
                    { id: "back_lat_pulldown", name: "exercises.back_lat_pulldown", type: "compound", sets: 3, restSeconds: 90, targetZone: "lats" },
                    { id: "legs_rdl_db", name: "exercises.legs_rdl_db", type: "compound", sets: 3, restSeconds: 90, targetZone: "hamstring" },
                    { id: "shd_overhead_press_db", name: "exercises.shd_overhead_press_db", type: "compound", sets: 3, restSeconds: 90, targetZone: "deltoids" },
                    { id: "abs_plank", name: "exercises.abs_plank", type: "isolation", sets: 3, restSeconds: 60, targetZone: "abs" }
                ]
            },
            { id: "rest_1", name: "routine_templates.day.rest", exercises: [] }, // Martes: Descanso
            {
                id: "fb_day_2",
                name: "routine_templates.day.fb_b",
                exercises: [
                    { id: "legs_squat_goblet", name: "exercises.legs_squat_goblet", type: "compound", sets: 3, restSeconds: 120, targetZone: "quadriceps" },
                    { id: "chest_incline_press_db", name: "exercises.chest_incline_press_db", type: "compound", sets: 3, restSeconds: 90, targetZone: "chest" },
                    { id: "back_pullups", name: "exercises.back_pullups", type: "compound", sets: 3, restSeconds: 90, targetZone: "lats" },
                    { id: "legs_rdl_bar", name: "exercises.legs_rdl_bar", type: "compound", sets: 3, restSeconds: 90, targetZone: "hamstring" },
                    { id: "shd_overhead_press_bar", name: "exercises.shd_overhead_press_bar", type: "compound", sets: 3, restSeconds: 90, targetZone: "deltoids" },
                    { id: "abs_crunch", name: "exercises.abs_crunch", type: "isolation", sets: 3, restSeconds: 60, targetZone: "abs" }
                ]
            },
            { id: "rest_2", name: "routine_templates.day.rest", exercises: [] }, // Jueves: Descanso
            {
                id: "fb_day_3",
                name: "routine_templates.day.fb_c",
                exercises: [
                    { id: "legs_squat_bar_front", name: "exercises.legs_squat_bar_front", type: "compound", sets: 3, restSeconds: 120, targetZone: "quadriceps" },
                    { id: "chest_bench_press_db", name: "exercises.chest_bench_press_db", type: "compound", sets: 3, restSeconds: 90, targetZone: "chest" },
                    { id: "back_lat_pulldown_close", name: "exercises.back_lat_pulldown_close", type: "compound", sets: 3, restSeconds: 90, targetZone: "lats" },
                    { id: "legs_leg_press", name: "exercises.legs_leg_press", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
                    { id: "tricep_pushdown_rope", name: "exercises.tricep_pushdown_rope", type: "isolation", sets: 3, restSeconds: 60, targetZone: "triceps" },
                    { id: "bicep_hammer_curl", name: "exercises.bicep_hammer_curl", type: "isolation", sets: 3, restSeconds: 60, targetZone: "biceps" }
                ]
            },
            { id: "rest_3", name: "routine_templates.day.rest", exercises: [] }, // Sabado: Descanso
            { id: "rest_4", name: "routine_templates.day.rest", exercises: [] }  // Domingo: Descanso
        ]
    },
    {
        name: "routine_templates.routine_tp_4d",
        equipment: "Gym Completo",
        daysPerWeek: 4,
        days: [
            {
                id: "tp_torso_a",
                name: "routine_templates.day.tp_torso_a",
                exercises: [
                    { id: "chest_bench_press_bar", name: "exercises.chest_bench_press_bar", type: "compound", sets: 3, restSeconds: 120, targetZone: "chest" },
                    { id: "back_bent_row_bar", name: "exercises.back_bent_row_bar", type: "compound", sets: 3, restSeconds: 90, targetZone: "upper-back" },
                    { id: "chest_incline_press_db", name: "exercises.chest_incline_press_db", type: "compound", sets: 3, restSeconds: 90, targetZone: "chest" },
                    { id: "shd_lateral_raise_db", name: "exercises.shd_lateral_raise_db", type: "isolation", sets: 3, restSeconds: 60, targetZone: "deltoids" },
                    { id: "bicep_curl_bar", name: "exercises.bicep_curl_bar", type: "isolation", sets: 3, restSeconds: 60, targetZone: "biceps" },
                    { id: "tricep_pushdown_rope", name: "exercises.tricep_pushdown_rope", type: "isolation", sets: 3, restSeconds: 60, targetZone: "triceps" }
                ]
            },
            {
                id: "tp_legs_a",
                name: "routine_templates.day.tp_legs_a",
                exercises: [
                    { id: "legs_squat_bar_back", name: "exercises.legs_squat_bar_back", type: "compound", sets: 3, restSeconds: 120, targetZone: "quadriceps" },
                    { id: "legs_leg_press", name: "exercises.legs_leg_press", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
                    { id: "legs_rdl_db", name: "exercises.legs_rdl_db", type: "compound", sets: 3, restSeconds: 90, targetZone: "hamstring" },
                    { id: "legs_curl_seated", name: "exercises.legs_curl_seated", type: "isolation", sets: 3, restSeconds: 60, targetZone: "hamstring" },
                    { id: "calves_standing_raise", name: "exercises.calves_standing_raise", type: "isolation", sets: 4, restSeconds: 60, targetZone: "calves" }
                ]
            },
            { id: "rest_1", name: "routine_templates.day.rest", exercises: [] }, // Miercoles: Descanso
            {
                id: "tp_torso_b",
                name: "routine_templates.day.tp_torso_b",
                exercises: [
                    { id: "shd_overhead_press_bar", name: "exercises.shd_overhead_press_bar", type: "compound", sets: 3, restSeconds: 120, targetZone: "deltoids" },
                    { id: "back_lat_pulldown", name: "exercises.back_lat_pulldown", type: "compound", sets: 3, restSeconds: 90, targetZone: "lats" },
                    { id: "chest_dips", name: "exercises.chest_dips", type: "compound", sets: 3, restSeconds: 90, targetZone: "chest" },
                    { id: "back_chest_supported_row", name: "exercises.back_chest_supported_row", type: "compound", sets: 3, restSeconds: 90, targetZone: "upper-back" },
                    { id: "shd_lateral_raise_cable", name: "exercises.shd_lateral_raise_cable", type: "isolation", sets: 3, restSeconds: 60, targetZone: "deltoids" },
                    { id: "tricep_skullcrusher", name: "exercises.tricep_skullcrusher", type: "isolation", sets: 3, restSeconds: 60, targetZone: "triceps" }
                ]
            },
            {
                id: "tp_legs_b",
                name: "routine_templates.day.tp_legs_b",
                exercises: [
                    { id: "back_deadlift", name: "exercises.back_deadlift", type: "compound", sets: 3, restSeconds: 120, targetZone: "lower-back" },
                    { id: "legs_bulgarian_split", name: "exercises.legs_bulgarian_split", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
                    { id: "legs_extension", name: "exercises.legs_extension", type: "isolation", sets: 3, restSeconds: 60, targetZone: "quadriceps" },
                    { id: "legs_curl_lying", name: "exercises.legs_curl_lying", type: "isolation", sets: 3, restSeconds: 60, targetZone: "hamstring" },
                    { id: "calves_seated_raise", name: "exercises.calves_seated_raise", type: "isolation", sets: 4, restSeconds: 60, targetZone: "calves" }
                ]
            },
            { id: "rest_2", name: "routine_templates.day.rest", exercises: [] }, // Sabado: Descanso
            { id: "rest_3", name: "routine_templates.day.rest", exercises: [] }  // Domingo: Descanso
        ]
    },
    {
        name: "routine_templates.routine_ppl_ul_5d",
        equipment: "Gym Completo",
        daysPerWeek: 5,
        days: [
            {
                id: "ppl_push",
                name: "routine_templates.day.ppl_push",
                exercises: [
                    { id: "chest_bench_press_bar", name: "exercises.chest_bench_press_bar", type: "compound", sets: 3, restSeconds: 120, targetZone: "chest" },
                    { id: "shd_overhead_press_db", name: "exercises.shd_overhead_press_db", type: "compound", sets: 3, restSeconds: 90, targetZone: "deltoids" },
                    { id: "chest_incline_press_db", name: "exercises.chest_incline_press_db", type: "compound", sets: 3, restSeconds: 90, targetZone: "chest" },
                    { id: "shd_lateral_raise_db", name: "exercises.shd_lateral_raise_db", type: "isolation", sets: 4, restSeconds: 60, targetZone: "deltoids" },
                    { id: "tricep_pushdown_rope", name: "exercises.tricep_pushdown_rope", type: "isolation", sets: 3, restSeconds: 60, targetZone: "triceps" }
                ]
            },
            {
                id: "ppl_pull",
                name: "routine_templates.day.ppl_pull",
                exercises: [
                    { id: "back_lat_pulldown", name: "exercises.back_lat_pulldown", type: "compound", sets: 3, restSeconds: 90, targetZone: "lats" },
                    { id: "back_bent_row_bar", name: "exercises.back_bent_row_bar", type: "compound", sets: 3, restSeconds: 90, targetZone: "upper-back" },
                    { id: "back_seated_row", name: "exercises.back_seated_row", type: "compound", sets: 3, restSeconds: 90, targetZone: "lats" },
                    { id: "back_face_pull", name: "exercises.back_face_pull", type: "isolation", sets: 3, restSeconds: 60, targetZone: "deltoids" },
                    { id: "bicep_curl_bar", name: "exercises.bicep_curl_bar", type: "isolation", sets: 3, restSeconds: 60, targetZone: "biceps" }
                ]
            },
            {
                id: "ppl_legs",
                name: "routine_templates.day.ppl_legs",
                exercises: [
                    { id: "legs_squat_bar_back", name: "exercises.legs_squat_bar_back", type: "compound", sets: 3, restSeconds: 120, targetZone: "quadriceps" },
                    { id: "legs_rdl_db", name: "exercises.legs_rdl_db", type: "compound", sets: 3, restSeconds: 90, targetZone: "hamstring" },
                    { id: "legs_extension", name: "exercises.legs_extension", type: "isolation", sets: 3, restSeconds: 60, targetZone: "quadriceps" },
                    { id: "calves_standing_raise", name: "exercises.calves_standing_raise", type: "isolation", sets: 4, restSeconds: 60, targetZone: "calves" },
                    { id: "abs_leg_raise_lying", name: "exercises.abs_leg_raise_lying", type: "isolation", sets: 3, restSeconds: 60, targetZone: "abs" }
                ]
            },
            { id: "rest_1", name: "routine_templates.day.rest", exercises: [] }, // Jueves: Descanso
            {
                id: "ppl_upper",
                name: "routine_templates.day.ppl_upper",
                exercises: [
                    { id: "chest_incline_press_bar", name: "exercises.chest_incline_press_bar", type: "compound", sets: 3, restSeconds: 120, targetZone: "chest" },
                    { id: "back_bent_row_db", name: "exercises.back_bent_row_db", type: "compound", sets: 3, restSeconds: 90, targetZone: "lats" },
                    { id: "shd_arnold_press", name: "exercises.shd_arnold_press", type: "compound", sets: 3, restSeconds: 90, targetZone: "deltoids" },
                    { id: "back_lat_pulldown_close", name: "exercises.back_lat_pulldown_close", type: "compound", sets: 3, restSeconds: 90, targetZone: "lats" },
                    { id: "bicep_hammer_curl", name: "exercises.bicep_hammer_curl", type: "isolation", sets: 3, restSeconds: 60, targetZone: "biceps" },
                    { id: "chest_dips", name: "exercises.chest_dips", type: "compound", sets: 3, restSeconds: 90, targetZone: "chest" }
                ]
            },
            {
                id: "ppl_lower",
                name: "routine_templates.day.ppl_lower",
                exercises: [
                    { id: "back_deadlift", name: "exercises.back_deadlift", type: "compound", sets: 3, restSeconds: 90, targetZone: "lower-back" },
                    { id: "legs_leg_press", name: "exercises.legs_leg_press", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
                    { id: "legs_curl_lying", name: "exercises.legs_curl_lying", type: "isolation", sets: 3, restSeconds: 60, targetZone: "hamstring" },
                    { id: "legs_lunge_walking", name: "exercises.legs_lunge_walking", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
                    { id: "abs_plank", name: "exercises.abs_plank", type: "isolation", sets: 3, restSeconds: 60, targetZone: "abs" }
                ]
            },
            { id: "rest_2", name: "routine_templates.day.rest", exercises: [] } // Domingo: Descanso
        ]
    },
    {
        name: "routine_templates.routine_ppl_6d",
        equipment: "Gym Completo",
        daysPerWeek: 6,
        days: [
            {
                id: "ppl6_push_a",
                name: "routine_templates.day.ppl6_push_a",
                exercises: [
                    { id: "chest_bench_press_bar", name: "exercises.chest_bench_press_bar", type: "compound", sets: 4, restSeconds: 120, targetZone: "chest" },
                    { id: "shd_overhead_press_db", name: "exercises.shd_overhead_press_db", type: "compound", sets: 3, restSeconds: 120, targetZone: "deltoids" },
                    { id: "chest_incline_press_db", name: "exercises.chest_incline_press_db", type: "compound", sets: 3, restSeconds: 90, targetZone: "chest" },
                    { id: "tricep_pushdown_bar", name: "exercises.tricep_pushdown_bar", type: "isolation", sets: 3, restSeconds: 60, targetZone: "triceps" },
                    { id: "shd_lateral_raise_db", name: "exercises.shd_lateral_raise_db", type: "isolation", sets: 4, restSeconds: 60, targetZone: "deltoids" }
                ]
            },
            {
                id: "ppl6_pull_a",
                name: "routine_templates.day.ppl6_pull_a",
                exercises: [
                    { id: "back_deadlift", name: "exercises.back_deadlift", type: "compound", sets: 3, restSeconds: 180, targetZone: "lower-back" },
                    { id: "back_pendlay_row", name: "exercises.back_pendlay_row", type: "compound", sets: 4, restSeconds: 120, targetZone: "upper-back" },
                    { id: "back_pullups", name: "exercises.back_pullups", type: "compound", sets: 3, restSeconds: 120, targetZone: "lats" },
                    { id: "back_face_pull_high", name: "exercises.back_face_pull_high", type: "isolation", sets: 3, restSeconds: 60, targetZone: "deltoids" },
                    { id: "bicep_curl_bar", name: "exercises.bicep_curl_bar", type: "isolation", sets: 3, restSeconds: 60, targetZone: "biceps" }
                ]
            },
            {
                id: "ppl6_legs_a",
                name: "routine_templates.day.ppl6_legs_a",
                exercises: [
                    { id: "legs_squat_bar_back", name: "exercises.legs_squat_bar_back", type: "compound", sets: 4, restSeconds: 120, targetZone: "quadriceps" },
                    { id: "legs_leg_press", name: "exercises.legs_leg_press", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
                    { id: "legs_rdl_db", name: "exercises.legs_rdl_db", type: "compound", sets: 3, restSeconds: 90, targetZone: "hamstring" },
                    { id: "legs_extension", name: "exercises.legs_extension", type: "isolation", sets: 3, restSeconds: 60, targetZone: "quadriceps" },
                    { id: "calves_standing_raise", name: "exercises.calves_standing_raise", type: "isolation", sets: 4, restSeconds: 60, targetZone: "calves" }
                ]
            },
            {
                id: "ppl6_push_b",
                name: "routine_templates.day.ppl6_push_b",
                exercises: [
                    { id: "chest_incline_press_bar", name: "exercises.chest_incline_press_bar", type: "compound", sets: 3, restSeconds: 120, targetZone: "chest" },
                    { id: "chest_bench_press_db", name: "exercises.chest_bench_press_db", type: "compound", sets: 3, restSeconds: 90, targetZone: "chest" },
                    { id: "chest_fly_cable_low", name: "exercises.chest_fly_cable_low", type: "isolation", sets: 3, restSeconds: 60, targetZone: "chest" },
                    { id: "tricep_skullcrusher", name: "exercises.tricep_skullcrusher", type: "isolation", sets: 3, restSeconds: 60, targetZone: "triceps" },
                    { id: "shd_lateral_raise_cable", name: "exercises.shd_lateral_raise_cable", type: "isolation", sets: 4, restSeconds: 60, targetZone: "deltoids" }
                ]
            },
            {
                id: "ppl6_pull_b",
                name: "routine_templates.day.ppl6_pull_b",
                exercises: [
                    { id: "back_lat_pulldown_wide", name: "exercises.back_lat_pulldown_wide", type: "compound", sets: 3, restSeconds: 90, targetZone: "lats" },
                    { id: "back_bent_row_db", name: "exercises.back_bent_row_db", type: "compound", sets: 3, restSeconds: 90, targetZone: "lats" },
                    { id: "back_pullover_cable", name: "exercises.back_pullover_cable", type: "isolation", sets: 3, restSeconds: 60, targetZone: "lats" },
                    { id: "bicep_hammer_curl", name: "exercises.bicep_hammer_curl", type: "isolation", sets: 3, restSeconds: 60, targetZone: "biceps" },
                    { id: "shd_rear_fly_machine", name: "exercises.shd_rear_fly_machine", type: "isolation", sets: 4, restSeconds: 60, targetZone: "deltoids" }
                ]
            },
            {
                id: "ppl6_legs_b",
                name: "routine_templates.day.ppl6_legs_b",
                exercises: [
                    { id: "legs_bulgarian_split", name: "exercises.legs_bulgarian_split", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
                    { id: "glute_hip_thrust_bar", name: "exercises.glute_hip_thrust_bar", type: "compound", sets: 3, restSeconds: 90, targetZone: "gluteal" },
                    { id: "legs_curl_lying", name: "exercises.legs_curl_lying", type: "isolation", sets: 4, restSeconds: 60, targetZone: "hamstring" },
                    { id: "legs_lunge_walking", name: "exercises.legs_lunge_walking", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
                    { id: "calves_seated_raise", name: "exercises.calves_seated_raise", type: "isolation", sets: 4, restSeconds: 60, targetZone: "calves" }
                ]
            },
            { id: "rest_1", name: "routine_templates.day.rest", exercises: [] }  // Domingo: Descanso
        ]
    },

    // --- CALISTHENICS ROUTINES ---
    {
        name: "routine_templates.routine_cali_base_3d",
        equipment: "En casa-Sin equipo",
        daysPerWeek: 3,
        days: [
            {
                id: "cali_base_a",
                name: "routine_templates.day.cali_base_a",
                exercises: [
                    { id: "legs_air_squats", name: "exercises.legs_air_squats", type: "compound", sets: 4, restSeconds: 60, targetZone: "quadriceps" },
                    { id: "chest_pushups", name: "exercises.chest_pushups", type: "compound", sets: 4, restSeconds: 90, targetZone: "chest" },
                    { id: "back_inverted_row", name: "exercises.back_inverted_row", type: "compound", sets: 4, restSeconds: 90, targetZone: "upper-back" },
                    { id: "legs_lunge_reverse", name: "exercises.legs_lunge_reverse", type: "compound", sets: 3, restSeconds: 60, targetZone: "quadriceps" },
                    { id: "chest_dips", name: "exercises.chest_dips", type: "compound", sets: 3, restSeconds: 60, targetZone: "triceps" },
                    { id: "abs_plank", name: "exercises.abs_plank", type: "isolation", sets: 3, restSeconds: 45, targetZone: "abs" }
                ]
            },
            {
                id: "cali_base_b",
                name: "routine_templates.day.cali_base_b",
                exercises: [
                    { id: "legs_jump_squats", name: "exercises.legs_jump_squats", type: "compound", sets: 4, restSeconds: 60, targetZone: "quadriceps" },
                    { id: "chest_pushups_diamond", name: "exercises.chest_pushups_diamond", type: "compound", sets: 4, restSeconds: 90, targetZone: "chest" },
                    { id: "back_pullups", name: "exercises.back_pullups", type: "compound", sets: 3, restSeconds: 90, targetZone: "lats" },
                    { id: "legs_step_up", name: "exercises.legs_step_up", type: "compound", sets: 3, restSeconds: 60, targetZone: "quadriceps" },
                    { id: "abs_leg_raise_lying", name: "exercises.abs_leg_raise_lying", type: "isolation", sets: 3, restSeconds: 45, targetZone: "abs" }
                ]
            },
            {
                id: "cali_base_c",
                name: "routine_templates.day.cali_base_c",
                exercises: [
                    { id: "legs_air_squats", name: "exercises.legs_air_squats", type: "compound", sets: 4, restSeconds: 60, targetZone: "quadriceps" },
                    { id: "chest_pushups_decline", name: "exercises.chest_pushups_decline", type: "compound", sets: 4, restSeconds: 90, targetZone: "chest" },
                    { id: "back_inverted_row", name: "exercises.back_inverted_row", type: "compound", sets: 4, restSeconds: 90, targetZone: "upper-back" },
                    { id: "glute_bridge", name: "exercises.glute_bridge", type: "compound", sets: 3, restSeconds: 60, targetZone: "gluteal" },
                    { id: "tricep_dips_bench", name: "exercises.tricep_dips_bench", type: "isolation", sets: 3, restSeconds: 60, targetZone: "triceps" }
                ]
            }
        ]
    },
    {
        name: "routine_templates.routine_cali_prog_4d",
        equipment: "En casa-Sin equipo",
        daysPerWeek: 4,
        days: [
            {
                id: "cali_prog_torso_a",
                name: "routine_templates.day.cali_prog_torso_a",
                exercises: [
                    { id: "chest_pushups_diamond", name: "exercises.chest_pushups_diamond", type: "compound", sets: 3, restSeconds: 90, targetZone: "triceps" },
                    { id: "back_pullups", name: "exercises.back_pullups", type: "compound", sets: 3, restSeconds: 120, targetZone: "lats" },
                    { id: "chest_pushups_decline", name: "exercises.chest_pushups_decline", type: "compound", sets: 3, restSeconds: 90, targetZone: "chest" },
                    { id: "shd_pike_pushups", name: "exercises.shd_pike_pushups", type: "compound", sets: 3, restSeconds: 90, targetZone: "deltoids" },
                    { id: "back_supermans", name: "exercises.back_supermans", type: "isolation", sets: 3, restSeconds: 60, targetZone: "lower-back" }
                ]
            },
            {
                id: "cali_prog_legs_a",
                name: "routine_templates.day.cali_prog_legs_a",
                exercises: [
                    { id: "legs_bulgarian_split", name: "exercises.legs_bulgarian_split", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
                    { id: "legs_jump_squats", name: "exercises.legs_jump_squats", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
                    { id: "glute_bridge", name: "exercises.glute_bridge", type: "compound", sets: 3, restSeconds: 60, targetZone: "gluteal" },
                    { id: "calves_standing_raise", name: "exercises.calves_standing_raise", type: "isolation", sets: 4, restSeconds: 60, targetZone: "calves" },
                    { id: "abs_leg_raise_lying", name: "exercises.abs_leg_raise_lying", type: "isolation", sets: 3, restSeconds: 60, targetZone: "abs" }
                ]
            },
            {
                id: "cali_prog_torso_b",
                name: "routine_templates.day.cali_prog_torso_b",
                exercises: [
                    { id: "chest_dips", name: "exercises.chest_dips", type: "compound", sets: 3, restSeconds: 90, targetZone: "chest" },
                    { id: "back_chinups", name: "exercises.back_chinups", type: "compound", sets: 3, restSeconds: 120, targetZone: "biceps" },
                    { id: "chest_pushups", name: "exercises.chest_pushups", type: "compound", sets: 3, restSeconds: 90, targetZone: "chest" },
                    { id: "back_inverted_row", name: "exercises.back_inverted_row", type: "compound", sets: 3, restSeconds: 90, targetZone: "upper-back" },
                    { id: "abs_plank", name: "exercises.abs_plank", type: "isolation", sets: 3, restSeconds: 60, targetZone: "abs" }
                ]
            },
            {
                id: "cali_prog_legs_b",
                name: "routine_templates.day.cali_prog_legs_b",
                exercises: [
                    { id: "legs_air_squats", name: "exercises.legs_air_squats", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
                    { id: "legs_lunge_walking", name: "exercises.legs_lunge_walking", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
                    { id: "glute_kickback_cable", name: "exercises.glute_kickback_cable", type: "isolation", sets: 3, restSeconds: 60, targetZone: "gluteal" },
                    { id: "calves_standing_raise", name: "exercises.calves_standing_raise", type: "isolation", sets: 4, restSeconds: 60, targetZone: "calves" },
                    { id: "abs_russian_twist", name: "exercises.abs_russian_twist", type: "isolation", sets: 3, restSeconds: 60, targetZone: "abs" }
                ]
            }
        ]
    }
];

export const RoutineMigrationService = {
    /**
     * Uploads the hardcoded templates to the 'routines_templates' collection.
     * Use this to seed the database.
     */
    async uploadRoutineTemplates() {
        try {
            console.log("Starting migration of routine templates...");
            const collectionRef = collection(db, "routines_templates");

            // 1. Clear existing templates to avoid duplicates
            const existingSnapshot = await getDocs(collectionRef);
            if (!existingSnapshot.empty) {
                console.log(`Deleting ${existingSnapshot.size} existing templates...`);
                // Batch delete (max 500 per batch)
                const deleteBatch = writeBatch(db);
                existingSnapshot.docs.forEach((doc) => {
                    deleteBatch.delete(doc.ref);
                });
                await deleteBatch.commit();
                console.log("Existing templates deleted.");
            }

            // 2. Upload new templates
            const batch = writeBatch(db);
            MOCK_TEMPLATES_DATA.forEach((template) => {
                const docRef = doc(collectionRef);
                batch.set(docRef, {
                    ...template,
                    createdAt: new Date(),
                });
            });

            await batch.commit();
            console.log(`Successfully uploaded ${MOCK_TEMPLATES_DATA.length} templates.`);
            return { success: true, count: MOCK_TEMPLATES_DATA.length };
        } catch (error) {
            console.error("Error uploading templates:", error);
            return { success: false, error };
        }
    }
};
