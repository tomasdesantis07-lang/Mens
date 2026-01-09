import { BodyPartSlug } from "../types/bodyParts";

export const MUSCLE_CATEGORIES: { label: string; muscles: { slug: BodyPartSlug; label: string }[] }[] = [
    {
        label: "Tren Superior",
        muscles: [
            { slug: "chest", label: "Pecho" },
            { slug: "deltoids", label: "Hombros" },
            { slug: "triceps", label: "Tríceps" },
            { slug: "biceps", label: "Bíceps" },
            { slug: "forearm", label: "Antebrazos" },
        ],
    },
    {
        label: "Espalda",
        muscles: [
            { slug: "lats", label: "Dorsales" },
            { slug: "upper-back", label: "Espalda Alta" },
            { slug: "trapezius", label: "Trapecios" },
            { slug: "lower-back", label: "Lumbar" },
        ],
    },
    {
        label: "Core",
        muscles: [
            { slug: "abs", label: "Abdominales" },
            { slug: "obliques", label: "Oblicuos" },
        ],
    },
    {
        label: "Tren Inferior",
        muscles: [
            { slug: "quadriceps", label: "Cuádriceps" },
            { slug: "hamstring", label: "Isquios" },
            { slug: "gluteal", label: "Glúteos" },
            { slug: "calves", label: "Pantorrillas" },
            { slug: "adductors", label: "Aductores" },
        ],
    },
];

export const EQUIPMENT_OPTIONS = [
    { value: 'barbell', label: 'Barra', icon: 'barbell' },
    { value: 'dumbbell', label: 'Mancuerna', icon: 'dumbbell' },
    { value: 'machine', label: 'Máquina', icon: 'machine' },
    { value: 'cable', label: 'Polea', icon: 'cable' },
    { value: 'bodyweight', label: 'Peso Corporal', icon: 'body' },
    { value: 'kettlebell', label: 'Kettlebell', icon: 'kettlebell' },
    { value: 'smith_machine', label: 'Multipower', icon: 'machine' },
    { value: 'cardio', label: 'Cardio', icon: 'cardio' },
];
