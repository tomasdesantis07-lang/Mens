import { CatalogExercise } from "../types/exercise";

export const EXERCISE_CATALOG: CatalogExercise[] = [
    // ==================== PECHO (CHEST) ====================
    { id: "chest_bench_press_bar", nameKey: "Press Banca (Barra)", primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "deltoids"], equipment: "barbell", mechanic: "compound", force: "push" },
    { id: "chest_bench_press_db", nameKey: "Press Banca (Mancuernas)", primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "deltoids"], equipment: "dumbbell", mechanic: "compound", force: "push" },
    { id: "chest_incline_press_bar", nameKey: "Press Inclinado (Barra)", primaryMuscles: ["chest", "deltoids"], secondaryMuscles: ["triceps"], equipment: "barbell", mechanic: "compound", force: "push" },
    { id: "chest_incline_press_db", nameKey: "Press Inclinado (Mancuernas)", primaryMuscles: ["chest", "deltoids"], secondaryMuscles: ["triceps"], equipment: "dumbbell", mechanic: "compound", force: "push" },
    { id: "chest_decline_press_bar", nameKey: "Press Declinado (Barra)", primaryMuscles: ["chest"], secondaryMuscles: ["triceps"], equipment: "barbell", mechanic: "compound", force: "push" },
    { id: "chest_dips", nameKey: "Fondos en Paralelas (Pecho)", primaryMuscles: ["chest", "triceps"], secondaryMuscles: ["deltoids"], equipment: "bodyweight", mechanic: "compound", force: "push" },
    { id: "chest_dips_weighted", nameKey: "Fondos con Lastre", primaryMuscles: ["chest", "triceps"], secondaryMuscles: ["deltoids"], equipment: "bodyweight", mechanic: "compound", force: "push" },
    { id: "chest_pushups", nameKey: "Flexiones (Push-ups)", primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "abs"], equipment: "bodyweight", mechanic: "compound", force: "push" },
    { id: "chest_pushups_diamond", nameKey: "Flexiones Diamante", primaryMuscles: ["triceps", "chest"], secondaryMuscles: ["deltoids"], equipment: "bodyweight", mechanic: "compound", force: "push" },
    { id: "chest_fly_db", nameKey: "Aperturas con Mancuernas", primaryMuscles: ["chest"], secondaryMuscles: ["deltoids"], equipment: "dumbbell", mechanic: "isolation", force: "push" },
    { id: "chest_fly_cable_high", nameKey: "Cruce de Poleas (Alto)", primaryMuscles: ["chest"], secondaryMuscles: [], equipment: "cable", mechanic: "isolation", force: "push" },
    { id: "chest_fly_cable_low", nameKey: "Cruce de Poleas (Bajo)", primaryMuscles: ["chest"], secondaryMuscles: ["deltoids"], equipment: "cable", mechanic: "isolation", force: "push" },
    { id: "chest_pec_deck", nameKey: "Aperturas en Máquina (Pec Deck)", primaryMuscles: ["chest"], secondaryMuscles: ["deltoids"], equipment: "machine", mechanic: "isolation", force: "push" },
    { id: "chest_pullover_db", nameKey: "Pullover con Mancuerna", primaryMuscles: ["chest", "lats"], secondaryMuscles: ["triceps"], equipment: "dumbbell", mechanic: "isolation", force: "pull" },
    { id: "chest_press_machine", nameKey: "Press de Pecho en Máquina", primaryMuscles: ["chest"], secondaryMuscles: ["triceps"], equipment: "machine", mechanic: "compound", force: "push" },
    { id: "chest_svend_press", nameKey: "Press Svend", primaryMuscles: ["chest"], secondaryMuscles: [], equipment: "dumbbell", mechanic: "isolation", force: "push" },

    // ==================== ESPALDA (BACK) ====================
    { id: "back_deadlift", nameKey: "Peso Muerto (Convencional)", primaryMuscles: ["lower-back", "gluteal", "hamstring"], secondaryMuscles: ["trapezius", "forearm", "quadriceps", "lats"], equipment: "barbell", mechanic: "compound", force: "pull" },
    { id: "back_sumo_deadlift", nameKey: "Peso Muerto Sumo", primaryMuscles: ["gluteal", "adductors", "quadriceps"], secondaryMuscles: ["lower-back", "forearm"], equipment: "barbell", mechanic: "compound", force: "pull" },
    { id: "back_pullups", nameKey: "Dominadas Pronas (Pullups)", primaryMuscles: ["lats", "upper-back"], secondaryMuscles: ["biceps", "forearm"], equipment: "bodyweight", mechanic: "compound", force: "pull" },
    { id: "back_chinups", nameKey: "Dominadas Supinas (Chinups)", primaryMuscles: ["lats", "biceps"], secondaryMuscles: ["upper-back"], equipment: "bodyweight", mechanic: "compound", force: "pull" },
    { id: "back_lat_pulldown", nameKey: "Jalón al Pecho", primaryMuscles: ["lats"], secondaryMuscles: ["biceps"], equipment: "cable", mechanic: "compound", force: "pull" },
    { id: "back_lat_pulldown_close", nameKey: "Jalón al Pecho (Agarre Cerrado)", primaryMuscles: ["lats", "lower-back"], secondaryMuscles: ["biceps"], equipment: "cable", mechanic: "compound", force: "pull" },
    { id: "back_bent_row_bar", nameKey: "Remo con Barra (Bent Over)", primaryMuscles: ["upper-back", "lats"], secondaryMuscles: ["biceps", "lower-back"], equipment: "barbell", mechanic: "compound", force: "pull" },
    { id: "back_bent_row_db", nameKey: "Remo con Mancuerna (Unilateral)", primaryMuscles: ["lats", "upper-back"], secondaryMuscles: ["biceps", "obliques"], equipment: "dumbbell", mechanic: "compound", force: "pull" },
    { id: "back_seated_row", nameKey: "Remo en Polea Baja (Gironda)", primaryMuscles: ["upper-back", "lats"], secondaryMuscles: ["biceps"], equipment: "cable", mechanic: "compound", force: "pull" },
    { id: "back_tbar_row", nameKey: "Remo en Punta (T-Bar)", primaryMuscles: ["upper-back", "lats"], secondaryMuscles: ["biceps", "lower-back"], equipment: "barbell", mechanic: "compound", force: "pull" },
    { id: "back_chest_supported_row", nameKey: "Remo con Soporte al Pecho", primaryMuscles: ["upper-back", "lats"], secondaryMuscles: ["biceps"], equipment: "machine", mechanic: "compound", force: "pull" },
    { id: "back_shrugs_bar", nameKey: "Encogimientos con Barra", primaryMuscles: ["trapezius"], secondaryMuscles: ["forearm"], equipment: "barbell", mechanic: "isolation", force: "pull" },
    { id: "back_shrugs_db", nameKey: "Encogimientos con Mancuernas", primaryMuscles: ["trapezius"], secondaryMuscles: ["forearm"], equipment: "dumbbell", mechanic: "isolation", force: "pull" },
    { id: "back_face_pull", nameKey: "Face Pull", primaryMuscles: ["deltoids", "upper-back"], secondaryMuscles: ["trapezius"], equipment: "cable", mechanic: "isolation", force: "pull" },
    { id: "back_hyperextension", nameKey: "Hiperextensiones", primaryMuscles: ["lower-back"], secondaryMuscles: ["gluteal", "hamstring"], equipment: "bodyweight", mechanic: "isolation", force: "hinge" },
    { id: "back_pullover_cable", nameKey: "Pullover en Polea Alta", primaryMuscles: ["lats"], secondaryMuscles: ["triceps", "chest"], equipment: "cable", mechanic: "isolation", force: "pull" },

    // ==================== PIERNAS: CUÁDRICEPS ====================
    { id: "legs_squat_bar_back", nameKey: "Sentadilla Trasera (Barra)", primaryMuscles: ["quadriceps", "gluteal"], secondaryMuscles: ["lower-back", "adductors", "calves"], equipment: "barbell", mechanic: "compound", force: "squat" },
    { id: "legs_squat_bar_front", nameKey: "Sentadilla Frontal", primaryMuscles: ["quadriceps", "upper-back"], secondaryMuscles: ["gluteal", "abs"], equipment: "barbell", mechanic: "compound", force: "squat" },
    { id: "legs_squat_goblet", nameKey: "Sentadilla Goblet", primaryMuscles: ["quadriceps"], secondaryMuscles: ["gluteal", "abs"], equipment: "dumbbell", mechanic: "compound", force: "squat" },
    { id: "legs_leg_press", nameKey: "Prensa de Piernas (45 grados)", primaryMuscles: ["quadriceps"], secondaryMuscles: ["gluteal", "hamstring"], equipment: "machine", mechanic: "compound", force: "push" },
    { id: "legs_hack_squat", nameKey: "Sentadilla Hack", primaryMuscles: ["quadriceps"], secondaryMuscles: ["gluteal"], equipment: "machine", mechanic: "compound", force: "push" },
    { id: "legs_lunge_walking", nameKey: "Zancadas Caminando (Walking Lunges)", primaryMuscles: ["quadriceps", "gluteal"], secondaryMuscles: ["adductors", "calves"], equipment: "bodyweight", mechanic: "compound", force: "push" },
    { id: "legs_lunge_reverse", nameKey: "Zancadas Inversas", primaryMuscles: ["gluteal", "quadriceps"], secondaryMuscles: ["hamstring"], equipment: "dumbbell", mechanic: "compound", force: "push" },
    { id: "legs_bulgarian_split", nameKey: "Sentadilla Búlgara", primaryMuscles: ["quadriceps", "gluteal"], secondaryMuscles: ["hamstring"], equipment: "dumbbell", mechanic: "compound", force: "push" },
    { id: "legs_step_up", nameKey: "Subidas al Cajón (Step-Ups)", primaryMuscles: ["quadriceps", "gluteal"], secondaryMuscles: ["calves"], equipment: "bodyweight", mechanic: "compound", force: "push" },
    { id: "legs_extension", nameKey: "Extensiones de Cuádriceps", primaryMuscles: ["quadriceps"], secondaryMuscles: [], equipment: "machine", mechanic: "isolation", force: "push" },
    { id: "legs_sissy_squat", nameKey: "Sentadilla Sissy", primaryMuscles: ["quadriceps"], secondaryMuscles: [], equipment: "bodyweight", mechanic: "isolation", force: "squat" },

    // ==================== PIERNAS: ISQUIOS/GLÚTEO ====================
    { id: "legs_rdl_bar", nameKey: "Peso Muerto Rumano (Barra)", primaryMuscles: ["hamstring", "gluteal"], secondaryMuscles: ["lower-back", "forearm"], equipment: "barbell", mechanic: "compound", force: "hinge" },
    { id: "legs_rdl_db", nameKey: "Peso Muerto Rumano (Mancuernas)", primaryMuscles: ["hamstring", "gluteal"], secondaryMuscles: ["lower-back"], equipment: "dumbbell", mechanic: "compound", force: "hinge" },
    { id: "legs_curl_seated", nameKey: "Curl Femoral Sentado", primaryMuscles: ["hamstring"], secondaryMuscles: [], equipment: "machine", mechanic: "isolation", force: "pull" },
    { id: "legs_curl_lying", nameKey: "Curl Femoral Tumbado", primaryMuscles: ["hamstring"], secondaryMuscles: ["calves"], equipment: "machine", mechanic: "isolation", force: "pull" },
    { id: "legs_good_morning", nameKey: "Buenos Días", primaryMuscles: ["hamstring", "lower-back"], secondaryMuscles: ["gluteal"], equipment: "barbell", mechanic: "compound", force: "hinge" },
    { id: "glute_hip_thrust_bar", nameKey: "Hip Thrust (Barra)", primaryMuscles: ["gluteal"], secondaryMuscles: ["hamstring"], equipment: "barbell", mechanic: "compound", force: "push" },
    { id: "glute_bridge", nameKey: "Puente de Glúteo", primaryMuscles: ["gluteal"], secondaryMuscles: ["hamstring"], equipment: "bodyweight", mechanic: "isolation", force: "push" },
    { id: "glute_kickback_cable", nameKey: "Patada de Glúteo en Polea", primaryMuscles: ["gluteal"], secondaryMuscles: [], equipment: "cable", mechanic: "isolation", force: "push" },
    { id: "legs_abductor_machine", nameKey: "Máquina de Abductores", primaryMuscles: ["gluteal", "adductors"], secondaryMuscles: [], equipment: "machine", mechanic: "isolation", force: "push" },

    // ==================== PANTORRILLAS (CALVES) ====================
    { id: "calves_standing_raise", nameKey: "Elevación de Talones (De Pie)", primaryMuscles: ["calves"], secondaryMuscles: [], equipment: "machine", mechanic: "isolation", force: "push" },
    { id: "calves_seated_raise", nameKey: "Elevación de Talones (Sentado)", primaryMuscles: ["calves"], secondaryMuscles: [], equipment: "machine", mechanic: "isolation", force: "push" },
    { id: "calves_leg_press", nameKey: "Gemelos en Prensa", primaryMuscles: ["calves"], secondaryMuscles: [], equipment: "machine", mechanic: "isolation", force: "push" },
    { id: "calves_donkey", nameKey: "Elevación tipo Burro", primaryMuscles: ["calves"], secondaryMuscles: [], equipment: "machine", mechanic: "isolation", force: "push" },

    // ==================== HOMBROS (SHOULDERS/DELTOIDS) ====================
    { id: "shd_overhead_press_bar", nameKey: "Press Militar (Barra)", primaryMuscles: ["deltoids"], secondaryMuscles: ["triceps", "upper-back", "trapezius"], equipment: "barbell", mechanic: "compound", force: "push" },
    { id: "shd_overhead_press_db", nameKey: "Press de Hombros (Mancuernas)", primaryMuscles: ["deltoids"], secondaryMuscles: ["triceps"], equipment: "dumbbell", mechanic: "compound", force: "push" },
    { id: "shd_arnold_press", nameKey: "Press Arnold", primaryMuscles: ["deltoids"], secondaryMuscles: ["triceps"], equipment: "dumbbell", mechanic: "compound", force: "push" },
    { id: "shd_lateral_raise_db", nameKey: "Elevaciones Laterales (Mancuernas)", primaryMuscles: ["deltoids"], secondaryMuscles: [], equipment: "dumbbell", mechanic: "isolation", force: "push" },
    { id: "shd_lateral_raise_cable", nameKey: "Elevaciones Laterales en Polea", primaryMuscles: ["deltoids"], secondaryMuscles: [], equipment: "cable", mechanic: "isolation", force: "push" },
    { id: "shd_front_raise_db", nameKey: "Elevaciones Frontales", primaryMuscles: ["deltoids"], secondaryMuscles: ["chest"], equipment: "dumbbell", mechanic: "isolation", force: "push" },
    { id: "shd_rear_fly_db", nameKey: "Pájaros con Mancuernas (Posterior)", primaryMuscles: ["deltoids", "upper-back"], secondaryMuscles: [], equipment: "dumbbell", mechanic: "isolation", force: "pull" },
    { id: "shd_rear_fly_machine", nameKey: "Pájaros en Máquina (Peck Deck Inverso)", primaryMuscles: ["deltoids", "upper-back"], secondaryMuscles: [], equipment: "machine", mechanic: "isolation", force: "pull" },
    { id: "shd_upright_row", nameKey: "Remo al Mentón", primaryMuscles: ["deltoids", "trapezius"], secondaryMuscles: ["biceps"], equipment: "barbell", mechanic: "compound", force: "pull" },

    // ==================== BRAZOS: TRÍCEPS ====================
    { id: "tricep_pushdown_rope", nameKey: "Extensión de Tríceps (Cuerda)", primaryMuscles: ["triceps"], secondaryMuscles: [], equipment: "cable", mechanic: "isolation", force: "push" },
    { id: "tricep_pushdown_bar", nameKey: "Extensión de Tríceps (Barra)", primaryMuscles: ["triceps"], secondaryMuscles: [], equipment: "cable", mechanic: "isolation", force: "push" },
    { id: "tricep_skullcrusher", nameKey: "Rompecráneos (Skullcrusher)", primaryMuscles: ["triceps"], secondaryMuscles: [], equipment: "barbell", mechanic: "isolation", force: "push" },
    { id: "tricep_overhead_ext_db", nameKey: "Extensión sobre Cabeza (Mancuerna)", primaryMuscles: ["triceps"], secondaryMuscles: [], equipment: "dumbbell", mechanic: "isolation", force: "push" },
    { id: "tricep_close_grip_bench", nameKey: "Press Banca Agarre Cerrado", primaryMuscles: ["triceps", "chest"], secondaryMuscles: ["deltoids"], equipment: "barbell", mechanic: "compound", force: "push" },
    { id: "tricep_kickback", nameKey: "Patada de Tríceps", primaryMuscles: ["triceps"], secondaryMuscles: [], equipment: "dumbbell", mechanic: "isolation", force: "push" },

    // ==================== BRAZOS: BÍCEPS ====================
    { id: "bicep_curl_bar", nameKey: "Curl con Barra (De Pie)", primaryMuscles: ["biceps"], secondaryMuscles: ["forearm"], equipment: "barbell", mechanic: "isolation", force: "pull" },
    { id: "bicep_curl_db", nameKey: "Curl con Mancuernas", primaryMuscles: ["biceps"], secondaryMuscles: ["forearm"], equipment: "dumbbell", mechanic: "isolation", force: "pull" },
    { id: "bicep_hammer_curl", nameKey: "Curl Martillo", primaryMuscles: ["biceps", "forearm"], secondaryMuscles: [], equipment: "dumbbell", mechanic: "isolation", force: "pull" },
    { id: "bicep_preacher_curl", nameKey: "Curl Predicador (Banco Scott)", primaryMuscles: ["biceps"], secondaryMuscles: [], equipment: "barbell", mechanic: "isolation", force: "pull" },
    { id: "bicep_concentration_curl", nameKey: "Curl Concentrado", primaryMuscles: ["biceps"], secondaryMuscles: [], equipment: "dumbbell", mechanic: "isolation", force: "pull" },
    { id: "bicep_spider_curl", nameKey: "Curl Araña", primaryMuscles: ["biceps"], secondaryMuscles: [], equipment: "dumbbell", mechanic: "isolation", force: "pull" },
    { id: "bicep_cable_curl", nameKey: "Curl en Polea Baja", primaryMuscles: ["biceps"], secondaryMuscles: [], equipment: "cable", mechanic: "isolation", force: "pull" },
    { id: "forearm_wrist_curl", nameKey: "Curl de Muñeca", primaryMuscles: ["forearm"], secondaryMuscles: [], equipment: "dumbbell", mechanic: "isolation", force: "pull" },

    // ==================== ABDOMEN (CORE) ====================
    { id: "abs_crunch", nameKey: "Crunch Abdominal", primaryMuscles: ["abs"], secondaryMuscles: [], equipment: "bodyweight", mechanic: "isolation", force: "pull" },
    { id: "abs_plank", nameKey: "Plancha (Plank)", primaryMuscles: ["abs"], secondaryMuscles: ["deltoids", "lower-back"], equipment: "bodyweight", mechanic: "isolation", force: "static" },
    { id: "abs_leg_raise_hanging", nameKey: "Elevación de Piernas (Colgado)", primaryMuscles: ["abs", "obliques"], secondaryMuscles: ["forearm"], equipment: "bodyweight", mechanic: "isolation", force: "pull" },
    { id: "abs_leg_raise_lying", nameKey: "Elevación de Piernas (Tumbado)", primaryMuscles: ["abs"], secondaryMuscles: ["quadriceps"], equipment: "bodyweight", mechanic: "isolation", force: "pull" },
    { id: "abs_cable_crunch", nameKey: "Crunch en Polea Alta (Rodillas)", primaryMuscles: ["abs"], secondaryMuscles: [], equipment: "cable", mechanic: "isolation", force: "pull" },
    { id: "abs_russian_twist", nameKey: "Giros Rusos", primaryMuscles: ["obliques", "abs"], secondaryMuscles: [], equipment: "bodyweight", mechanic: "isolation", force: "pull" },
    { id: "abs_wheel_rollout", nameKey: "Rueda Abdominal (Ab Wheel)", primaryMuscles: ["abs", "lats"], secondaryMuscles: ["triceps"], equipment: "bodyweight", mechanic: "compound", force: "push" },
    { id: "abs_woodchopper", nameKey: "Leñador (Woodchopper)", primaryMuscles: ["obliques", "abs"], secondaryMuscles: ["deltoids"], equipment: "cable", mechanic: "compound", force: "pull" },

    // ==================== CARDIO & OTROS ====================
    { id: "cardio_treadmill", nameKey: "Cinta de Correr", primaryMuscles: ["quadriceps", "calves"], secondaryMuscles: ["hamstring"], equipment: "cardio", mechanic: "compound", force: "push" },
    { id: "cardio_elliptical", nameKey: "Elíptica", primaryMuscles: ["quadriceps", "gluteal"], secondaryMuscles: [], equipment: "cardio", mechanic: "compound", force: "push" },
    { id: "cardio_bike", nameKey: "Bicicleta Estática", primaryMuscles: ["quadriceps"], secondaryMuscles: ["calves"], equipment: "cardio", mechanic: "compound", force: "push" },
    { id: "cardio_rowing", nameKey: "Remo (Ergómetro)", primaryMuscles: ["upper-back", "lats", "quadriceps", "hamstring"], secondaryMuscles: ["biceps"], equipment: "cardio", mechanic: "compound", force: "pull" },
    { id: "cardio_jump_rope", nameKey: "Saltar la Soga", primaryMuscles: ["calves"], secondaryMuscles: ["deltoids"], equipment: "cardio", mechanic: "compound", force: "push" },
    { id: "plyo_box_jump", nameKey: "Salto al Cajón (Box Jump)", primaryMuscles: ["quadriceps", "gluteal"], secondaryMuscles: ["calves"], equipment: "bodyweight", mechanic: "compound", force: "push" },
    { id: "plyo_burpee", nameKey: "Burpees", primaryMuscles: ["quadriceps", "chest"], secondaryMuscles: ["deltoids", "abs"], equipment: "bodyweight", mechanic: "compound", force: "push" },
];
