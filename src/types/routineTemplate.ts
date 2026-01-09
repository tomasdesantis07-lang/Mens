import { Timestamp } from "firebase/firestore";
import { BodyPartSlug } from "./bodyParts";
import { Mechanic } from "./exercise";

export type TemplateEquipment = 'Gym Completo' | 'En casa-Sin equipo';

export interface TemplateExercise {
    id: string; // Internal ID or Catalog ID
    name: string;
    type: Mechanic; // 'compound' | 'isolation' (mapped from multi_articular / analitico)
    sets: number;
    restSeconds: number;
    targetZone?: BodyPartSlug;
}

export interface TemplateDay {
    id: string; // e.g., "day_1", "upper_a"
    name: string; // e.g., "Día 1", "Torso A"
    exercises: TemplateExercise[];
}

export interface RoutineTemplate {
    id?: string; // Firestore ID
    name: string; // e.g., "Full Body Novato A"
    equipment: TemplateEquipment;
    daysPerWeek: number;
    days: TemplateDay[]; // Structured days
    createdAt?: Timestamp;
}
