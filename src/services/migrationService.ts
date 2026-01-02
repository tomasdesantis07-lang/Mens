import { collection, doc, writeBatch } from "firebase/firestore";
import { RoutineTemplate } from "../types/routineTemplate";
import { db } from "./firebaseConfig";

// Full dataset from user request
const MOCK_TEMPLATES_DATA: RoutineTemplate[] = [
    // --- NOVATO - GYM ---
    {
        name: "Novato Gym - Full Body 2 Días",
        level: "Novato",
        goal: "Fuerza", // Default mapping for 'general'
        equipment: "Gym Completo",
        daysPerWeek: 2,
        exercises: [
            // Día 1
            { id: "goblet_squat", name: "Sentadilla Goblet", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
            { id: "bench_press", name: "Press de Banca", type: "compound", sets: 3, restSeconds: 90, targetZone: "chest" },
            { id: "cable_row", name: "Remo en Polea Baja", type: "compound", sets: 3, restSeconds: 90, targetZone: "lats" },
            { id: "lat_raise", name: "Vuelos Laterales", type: "isolation", sets: 3, restSeconds: 60, targetZone: "deltoids" },
            { id: "plank", name: "Plancha Abdominal", type: "isolation", sets: 3, restSeconds: 60, targetZone: "abs" },
            // Día 2
            { id: "leg_press", name: "Prensa de Piernas Inclinada", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
            { id: "lat_pulldown", name: "Jalón al Pecho", type: "compound", sets: 3, restSeconds: 90, targetZone: "lats" },
            { id: "shoulder_press_db", name: "Press de Hombros (Mancuernas)", type: "compound", sets: 3, restSeconds: 90, targetZone: "deltoids" },
            { id: "leg_curl", name: "Curl Femoral", type: "isolation", sets: 3, restSeconds: 60, targetZone: "hamstring" },
            { id: "dead_bug", name: "Dead Bug", type: "isolation", sets: 3, restSeconds: 60, targetZone: "abs" },
        ]
    },
    {
        name: "Novato Gym - Full Body A/B 3 Días",
        level: "Novato",
        goal: "Fuerza",
        equipment: "Gym Completo",
        daysPerWeek: 3,
        exercises: [
            // Rutina A
            { id: "squat", name: "Sentadilla con Barra", type: "compound", sets: 3, restSeconds: 120, targetZone: "quadriceps" },
            { id: "bench_press", name: "Press de Banca", type: "compound", sets: 3, restSeconds: 120, targetZone: "chest" },
            { id: "db_row", name: "Remo con Mancuerna", type: "compound", sets: 3, restSeconds: 90, targetZone: "lats" },
            { id: "leg_ext", name: "Extensiones de Cuádriceps", type: "isolation", sets: 3, restSeconds: 60, targetZone: "quadriceps" },
            { id: "tricep_press", name: "Press Francés", type: "isolation", sets: 3, restSeconds: 60, targetZone: "triceps" },
            // Rutina B
            { id: "rdl", name: "Peso Muerto Rumano", type: "compound", sets: 3, restSeconds: 120, targetZone: "hamstring" },
            { id: "lat_pulldown", name: "Jalón al Pecho", type: "compound", sets: 3, restSeconds: 90, targetZone: "lats" },
            { id: "ohp", name: "Press Militar", type: "compound", sets: 3, restSeconds: 90, targetZone: "deltoids" },
            { id: "lunges", name: "Zancadas", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
            { id: "bicep_curl", name: "Curl de Bíceps", type: "isolation", sets: 3, restSeconds: 60, targetZone: "biceps" },
        ]
    },
    {
        name: "Novato Gym - Torso/Pierna 4 Días",
        level: "Novato",
        goal: "Recomposición",
        equipment: "Gym Completo",
        daysPerWeek: 4,
        exercises: [
            // Torso
            { id: "bench_press", name: "Press de Banca Plano", type: "compound", sets: 4, restSeconds: 120, targetZone: "chest" },
            { id: "bb_row", name: "Remo con Barra", type: "compound", sets: 4, restSeconds: 120, targetZone: "lats" },
            { id: "incline_db_press", name: "Press Inclinado Mancuernas", type: "compound", sets: 3, restSeconds: 90, targetZone: "chest" },
            { id: "lat_pulldown", name: "Jalón al Pecho", type: "compound", sets: 3, restSeconds: 90, targetZone: "lats" },
            { id: "lat_raise", name: "Vuelos Laterales", type: "isolation", sets: 3, restSeconds: 60, targetZone: "deltoids" },
            { id: "arm_super", name: "Bíceps + Tríceps", type: "isolation", sets: 2, restSeconds: 60, targetZone: "biceps" },
            // Pierna
            { id: "squat", name: "Sentadilla con Barra", type: "compound", sets: 4, restSeconds: 120, targetZone: "quadriceps" },
            { id: "rdl", name: "Peso Muerto Rumano", type: "compound", sets: 4, restSeconds: 120, targetZone: "hamstring" },
            { id: "leg_press", name: "Prensa de Piernas", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
            { id: "leg_curl", name: "Curl Femoral", type: "isolation", sets: 3, restSeconds: 60, targetZone: "hamstring" },
            { id: "calves", name: "Gemelos en Máquina", type: "isolation", sets: 3, restSeconds: 60, targetZone: "calves" },
            { id: "plank", name: "Plancha Abdominal", type: "isolation", sets: 3, restSeconds: 60, targetZone: "abs" },
        ]
    },
    {
        name: "Novato Gym - Adaptación Progresiva 5 Días",
        level: "Novato",
        goal: "Resistencia",
        equipment: "Gym Completo",
        daysPerWeek: 5,
        exercises: [
            // Simplification: Representative exercises for the 5 days
            { id: "bench_press", name: "Press Banca", type: "compound", sets: 3, restSeconds: 90, targetZone: "chest" },
            { id: "squat", name: "Sentadilla", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
            { id: "lat_pulldown", name: "Jalón al Pecho", type: "compound", sets: 3, restSeconds: 90, targetZone: "lats" },
            { id: "rdl", name: "Peso Muerto Rumano", type: "compound", sets: 3, restSeconds: 90, targetZone: "hamstring" },
            { id: "full_body_review", name: "Full Body Técnico", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
        ]
    },
    {
        name: "Novato Gym - PPL 6 Días",
        level: "Novato",
        goal: "Recomposición",
        equipment: "Gym Completo",
        daysPerWeek: 6,
        exercises: [
            // Push
            { id: "bench_press", name: "Press de Banca", type: "compound", sets: 3, restSeconds: 90, targetZone: "chest" },
            { id: "shoulder_press", name: "Press de Hombros", type: "compound", sets: 3, restSeconds: 90, targetZone: "deltoids" },
            { id: "dips", name: "Fondos en Máquina", type: "compound", sets: 3, restSeconds: 90, targetZone: "triceps" },
            // Pull
            { id: "lat_pulldown", name: "Jalón al Pecho", type: "compound", sets: 3, restSeconds: 90, targetZone: "lats" },
            { id: "cable_row", name: "Remo en Polea", type: "compound", sets: 3, restSeconds: 90, targetZone: "lats" },
            { id: "facepull", name: "Facepulls", type: "isolation", sets: 3, restSeconds: 60, targetZone: "deltoids" },
            // Legs
            { id: "leg_press", name: "Prensa de Piernas", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
            { id: "leg_curl", name: "Curl Femoral", type: "isolation", sets: 3, restSeconds: 60, targetZone: "hamstring" },
            { id: "leg_ext", name: "Extensión Cuádriceps", type: "isolation", sets: 3, restSeconds: 60, targetZone: "quadriceps" },
        ]
    },

    // --- EXPERIMENTADO - GYM ---
    {
        name: "Experimentado Gym - 3 Días",
        level: "Experimentado",
        goal: "Fuerza",
        equipment: "Gym Completo",
        daysPerWeek: 3,
        exercises: [
            // Dia A
            { id: "squat", name: "Sentadilla con Barra", type: "compound", sets: 4, restSeconds: 120, targetZone: "quadriceps" },
            { id: "bench_press", name: "Press de Banca", type: "compound", sets: 4, restSeconds: 120, targetZone: "chest" },
            { id: "bb_row", name: "Remo con Barra", type: "compound", sets: 4, restSeconds: 120, targetZone: "lats" },
            // Dia B
            { id: "rdl", name: "Peso Muerto Rumano", type: "compound", sets: 4, restSeconds: 120, targetZone: "hamstring" },
            { id: "pull_up", name: "Dominadas", type: "compound", sets: 4, restSeconds: 120, targetZone: "lats" },
            { id: "incline_press", name: "Press Inclinado", type: "compound", sets: 4, restSeconds: 120, targetZone: "chest" },
            // Dia C
            { id: "lunges", name: "Estocadas", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
            { id: "dips", name: "Fondos en Paralelas", type: "compound", sets: 3, restSeconds: 90, targetZone: "chest" },
            { id: "cable_row", name: "Remo en Polea Baja", type: "compound", sets: 3, restSeconds: 90, targetZone: "lats" },
        ]
    },
    {
        name: "Experimentado Gym - Torso/Pierna 4 Días",
        level: "Experimentado",
        goal: "Recomposición",
        equipment: "Gym Completo",
        daysPerWeek: 4,
        exercises: [
            // Torso
            { id: "bench_press", name: "Press de Banca", type: "compound", sets: 4, restSeconds: 120, targetZone: "chest" },
            { id: "bb_row", name: "Remo con Barra", type: "compound", sets: 4, restSeconds: 120, targetZone: "lats" },
            { id: "ohp", name: "Press Militar", type: "compound", sets: 4, restSeconds: 120, targetZone: "deltoids" },
            { id: "pull_up", name: "Dominadas", type: "compound", sets: 4, restSeconds: 120, targetZone: "lats" },
            // Pierna
            { id: "squat", name: "Sentadilla con Barra", type: "compound", sets: 4, restSeconds: 120, targetZone: "quadriceps" },
            { id: "rdl", name: "Peso Muerto Rumano", type: "compound", sets: 4, restSeconds: 120, targetZone: "hamstring" },
            { id: "lunges", name: "Estocadas", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
            { id: "leg_curl", name: "Curl Femoral", type: "isolation", sets: 3, restSeconds: 60, targetZone: "hamstring" },
        ]
    },
    {
        name: "Experimentado Gym - PPL+Torso/Pierna 5 Días",
        level: "Experimentado",
        goal: "Recomposición",
        equipment: "Gym Completo",
        daysPerWeek: 5,
        exercises: [
            // Push
            { id: "bench_press", name: "Press de Banca", type: "compound", sets: 4, restSeconds: 120, targetZone: "chest" },
            { id: "ohp", name: "Press Militar", type: "compound", sets: 4, restSeconds: 120, targetZone: "deltoids" },
            // Pull
            { id: "deadlift", name: "Peso Muerto Convencional", type: "compound", sets: 3, restSeconds: 180, targetZone: "hamstring" },
            { id: "pull_up_weighted", name: "Dominadas Lastradas", type: "compound", sets: 4, restSeconds: 120, targetZone: "lats" },
            // Legs
            { id: "squat", name: "Sentadilla Trasera", type: "compound", sets: 4, restSeconds: 120, targetZone: "quadriceps" },
            { id: "leg_press", name: "Prensa de Piernas", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
            // Torso
            { id: "incline_db", name: "Press Inclinado Mancuernas", type: "compound", sets: 3, restSeconds: 90, targetZone: "chest" },
            { id: "row_cable", name: "Remo Polea Baja", type: "compound", sets: 3, restSeconds: 90, targetZone: "lats" },
            // Leg Focus
            { id: "rdl", name: "Peso Muerto Rumano", type: "compound", sets: 4, restSeconds: 120, targetZone: "hamstring" },
            { id: "lunges", name: "Zancadas", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
        ]
    },
    {
        name: "Experimentado Gym - PPLx2 6 Días",
        level: "Experimentado",
        goal: "Recomposición",
        equipment: "Gym Completo",
        daysPerWeek: 6,
        exercises: [
            // Push A
            { id: "bench_press", name: "Press de Banca", type: "compound", sets: 4, restSeconds: 120, targetZone: "chest" },
            { id: "ohp", name: "Press Militar", type: "compound", sets: 3, restSeconds: 90, targetZone: "deltoids" },
            // Pull A
            { id: "deadlift", name: "Peso Muerto", type: "compound", sets: 3, restSeconds: 180, targetZone: "hamstring" },
            { id: "pull_up", name: "Dominadas", type: "compound", sets: 4, restSeconds: 120, targetZone: "lats" },
            // Legs A
            { id: "squat", name: "Sentadilla", type: "compound", sets: 4, restSeconds: 120, targetZone: "quadriceps" },
            // ... (Implicit repetition for B)
            { id: "incline_press", name: "Press Inclinado (Push B)", type: "compound", sets: 3, restSeconds: 90, targetZone: "chest" },
            { id: "lat_pulldown", name: "Jalón al Pecho (Pull B)", type: "compound", sets: 3, restSeconds: 90, targetZone: "lats" },
            { id: "rdl", name: "Peso Muerto Rumano (Legs B)", type: "compound", sets: 3, restSeconds: 120, targetZone: "hamstring" },
        ]
    },

    // --- NOVATO - CALISTENIA (En casa-Sin equipo) ---
    {
        name: "Novato Calistenia - Full Body Fundamental 2 Días", // Using 2 days as low freq proxy, title says fundamental
        level: "Novato",
        goal: "Resistencia",
        equipment: "En casa-Sin equipo",
        daysPerWeek: 2,
        exercises: [
            { id: "pushup_incline", name: "Flexiones Inclinadas", type: "compound", sets: 3, restSeconds: 90, targetZone: "chest" },
            { id: "air_squat", name: "Sentadillas Air Squat", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
            { id: "inverted_row", name: "Remo Invertido", type: "compound", sets: 3, restSeconds: 90, targetZone: "lats" },
            { id: "lunges", name: "Zancadas", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
            { id: "plank", name: "Plancha Abdominal", type: "isolation", sets: 3, restSeconds: 60, targetZone: "abs" },
        ]
    },
    {
        name: "Novato Calistenia - Full Body A/B 3 Días",
        level: "Novato",
        goal: "Resistencia",
        equipment: "En casa-Sin equipo",
        daysPerWeek: 3,
        exercises: [
            // A
            { id: "pushup", name: "Flexiones Estándar", type: "compound", sets: 3, restSeconds: 90, targetZone: "chest" },
            { id: "squat", name: "Sentadillas", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
            { id: "inverted_row", name: "Remo Invertido", type: "compound", sets: 3, restSeconds: 90, targetZone: "lats" },
            // B
            { id: "pike_pushup", name: "Pike Pushups", type: "compound", sets: 3, restSeconds: 90, targetZone: "deltoids" },
            { id: "lunges", name: "Zancadas", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
            { id: "chin_up_assist", name: "Dominadas Asistidas", type: "compound", sets: 3, restSeconds: 90, targetZone: "lats" },
        ]
    },
    {
        name: "Novato Calistenia - Upper/Lower 4 Días",
        level: "Novato",
        goal: "Resistencia",
        equipment: "En casa-Sin equipo",
        daysPerWeek: 4,
        exercises: [
            // Upper
            { id: "pushup", name: "Flexiones", type: "compound", sets: 3, restSeconds: 90, targetZone: "chest" },
            { id: "inverted_row", name: "Remo Invertido", type: "compound", sets: 3, restSeconds: 90, targetZone: "lats" },
            { id: "pike_pushup", name: "Pike Pushups", type: "compound", sets: 3, restSeconds: 90, targetZone: "deltoids" },
            // Lower
            { id: "squat", name: "Sentadillas", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
            { id: "rdl_bw", name: "Peso Muerto Rumano (Bodyweight)", type: "compound", sets: 3, restSeconds: 90, targetZone: "hamstring" },
            { id: "lunges", name: "Zancadas", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
        ]
    },
    {
        name: "Novato Calistenia - Estímulo Progresivo 5 Días",
        level: "Novato",
        goal: "Resistencia",
        equipment: "En casa-Sin equipo",
        daysPerWeek: 5,
        exercises: [
            // Empuje
            { id: "pushup", name: "Flexiones", type: "compound", sets: 3, restSeconds: 90, targetZone: "chest" },
            { id: "dips_bench", name: "Fondos en Banco", type: "compound", sets: 3, restSeconds: 90, targetZone: "triceps" },
            // Pierna
            { id: "squat", name: "Sentadillas", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
            // Traccion
            { id: "inverted_row", name: "Remo Invertido", type: "compound", sets: 3, restSeconds: 90, targetZone: "lats" },
            // Pierna/Core
            { id: "cossack_squat", name: "Sentadilla Lateral", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
            // Full Body
            { id: "full_body", name: "Full Body Técnico", type: "compound", sets: 2, restSeconds: 60, targetZone: "quadriceps" },
        ]
    },
    {
        name: "Novato Calistenia - PPL 6 Días",
        level: "Novato",
        goal: "Resistencia",
        equipment: "En casa-Sin equipo",
        daysPerWeek: 6,
        exercises: [
            // Push
            { id: "pushup_diamond", name: "Flexiones Diamante", type: "compound", sets: 3, restSeconds: 90, targetZone: "triceps" },
            { id: "pike_pushup", name: "Pike Pushups", type: "compound", sets: 3, restSeconds: 90, targetZone: "deltoids" },
            // Pull
            { id: "inverted_row", name: "Remo Invertido", type: "compound", sets: 3, restSeconds: 90, targetZone: "lats" },
            { id: "superman", name: "Superman", type: "isolation", sets: 3, restSeconds: 60, targetZone: "lower-back" },
            // Legs
            { id: "bulgarian_squat", name: "Sentadilla Búlgara", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
            { id: "sl_deadlift", name: "Peso Muerto 1 Pierna", type: "compound", sets: 3, restSeconds: 90, targetZone: "hamstring" },
        ]
    },

    // --- EXPERIMENTADO - CALISTENIA ---
    {
        name: "Experimentado Calistenia - Full Body Potencia 2 Días", // Mapped to 2 days for low freq
        level: "Experimentado",
        goal: "Fuerza", // "Potencia"
        equipment: "En casa-Sin equipo",
        daysPerWeek: 2,
        exercises: [
            { id: "archer_pushup", name: "Flexiones Arqueras", type: "compound", sets: 4, restSeconds: 120, targetZone: "chest" },
            { id: "bulgarian_squat", name: "Sentadilla Búlgara", type: "compound", sets: 4, restSeconds: 120, targetZone: "quadriceps" },
            { id: "pull_up", name: "Dominadas", type: "compound", sets: 4, restSeconds: 120, targetZone: "lats" },
            { id: "dips", name: "Fondos (Dips)", type: "compound", sets: 4, restSeconds: 120, targetZone: "triceps" },
            { id: "glute_bridge_sl", name: "Puente Glúteo 1 Pierna", type: "isolation", sets: 3, restSeconds: 60, targetZone: "gluteal" },
        ]
    },
    {
        name: "Experimentado Calistenia - Full Body A/B 3 Días",
        level: "Experimentado",
        goal: "Fuerza",
        equipment: "En casa-Sin equipo",
        daysPerWeek: 3,
        exercises: [
            // A
            { id: "diamond_pushup", name: "Flexiones Diamante", type: "compound", sets: 4, restSeconds: 90, targetZone: "triceps" },
            { id: "pistol_squat", name: "Pistol Squats", type: "compound", sets: 4, restSeconds: 120, targetZone: "quadriceps" },
            { id: "inverted_row", name: "Remo Invertido", type: "compound", sets: 4, restSeconds: 90, targetZone: "lats" },
            // B
            { id: "pike_pushup", name: "Pike Pushups", type: "compound", sets: 4, restSeconds: 90, targetZone: "deltoids" },
            { id: "cossack_squat", name: "Sentadilla Cosaca", type: "compound", sets: 3, restSeconds: 90, targetZone: "quadriceps" },
            { id: "pull_up", name: "Dominadas", type: "compound", sets: 4, restSeconds: 120, targetZone: "lats" },
        ]
    },
    {
        name: "Experimentado Calistenia - Upper/Lower 4 Días",
        level: "Experimentado",
        goal: "Fuerza",
        equipment: "En casa-Sin equipo",
        daysPerWeek: 4,
        exercises: [
            // Upper
            { id: "decline_pushup", name: "Flexiones Pies Elevados", type: "compound", sets: 4, restSeconds: 90, targetZone: "chest" },
            { id: "inverted_row", name: "Remo Invertido", type: "compound", sets: 4, restSeconds: 90, targetZone: "lats" },
            { id: "dips", name: "Fondos", type: "compound", sets: 3, restSeconds: 90, targetZone: "triceps" },
            // Lower
            { id: "pistol_squat", name: "Pistol Squats", type: "compound", sets: 4, restSeconds: 120, targetZone: "quadriceps" },
            { id: "nordic_curl", name: "Nordic Curls", type: "compound", sets: 3, restSeconds: 120, targetZone: "hamstring" },
        ]
    },
    {
        name: "Experimentado Calistenia - PPL 5 Días",
        level: "Experimentado",
        goal: "Fuerza",
        equipment: "En casa-Sin equipo",
        daysPerWeek: 5,
        exercises: [
            // Push
            { id: "explosive_pushup", name: "Flexiones Explosivas", type: "compound", sets: 4, restSeconds: 90, targetZone: "chest" },
            { id: "dips", name: "Fondos", type: "compound", sets: 3, restSeconds: 90, targetZone: "triceps" },
            // Pull
            { id: "inverted_row_narrow", name: "Remo Invertido Estrecho", type: "compound", sets: 4, restSeconds: 90, targetZone: "lats" },
            { id: "pull_up_neg", name: "Dominadas Negativas", type: "compound", sets: 3, restSeconds: 90, targetZone: "lats" },
            // Legs
            { id: "bulgarian_squat", name: "Sentadilla Búlgara", type: "compound", sets: 4, restSeconds: 90, targetZone: "quadriceps" },
            { id: "rdl_sl", name: "Peso Muerto Rumano 1 Pierna", type: "compound", sets: 3, restSeconds: 90, targetZone: "hamstring" },
            // Upper
            { id: "diamond_pushup", name: "Flexiones Diamante", type: "compound", sets: 3, restSeconds: 90, targetZone: "triceps" },
            // Lower
            { id: "pistol_squat", name: "Pistol Squats", type: "compound", sets: 3, restSeconds: 120, targetZone: "quadriceps" },
        ]
    },
    {
        name: "Experimentado Calistenia - PPLx2 6 Días",
        level: "Experimentado",
        goal: "Fuerza",
        equipment: "En casa-Sin equipo",
        daysPerWeek: 6,
        exercises: [
            // Push A/B
            { id: "archer_pushup", name: "Flexiones Archer", type: "compound", sets: 4, restSeconds: 90, targetZone: "chest" },
            { id: "pike_pushup", name: "Pike Pushups", type: "compound", sets: 4, restSeconds: 90, targetZone: "deltoids" },
            // Pull A/B
            { id: "inverted_row_feet", name: "Remo Invertido Pies Elevados", type: "compound", sets: 4, restSeconds: 90, targetZone: "lats" },
            { id: "pull_up", name: "Dominadas", type: "compound", sets: 4, restSeconds: 120, targetZone: "lats" },
            // Legs A/B
            { id: "pistol_squat", name: "Pistol Squats", type: "compound", sets: 4, restSeconds: 120, targetZone: "quadriceps" },
            { id: "nordic_curl", name: "Nordic Curls", type: "compound", sets: 3, restSeconds: 120, targetZone: "hamstring" },
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
            const batch = writeBatch(db);
            const collectionRef = collection(db, "routines_templates");

            // Optional: clear existing if needed, but for now just appending/overwriting if we had IDs.
            // Since we use auto-ID, it will duplicate if run multiple times without cleanup.

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
