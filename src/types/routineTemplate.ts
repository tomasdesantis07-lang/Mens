import { Timestamp } from "firebase/firestore";
import { BodyPartSlug } from "./bodyParts";
import { Mechanic } from "./exercise";

export type TemplateLevel = 'Novato' | 'Experimentado';
export type TemplateGoal = 'Fuerza' | 'Recomposición' | 'Resistencia';
export type TemplateEquipment = 'Gym Completo' | 'En casa-Sin equipo';

export interface TemplateExercise {
    id: string; // Internal ID or Catalog ID
    name: string;
    type: Mechanic; // 'compound' | 'isolation' (mapped from multi_articular / analitico)
    sets: number;
    restSeconds: number;
    targetZone?: BodyPartSlug;
}

export interface RoutineTemplate {
    id?: string; // Firestore ID
    name: string; // e.g., "Full Body Novato A"
    level: TemplateLevel;
    goal: TemplateGoal;
    equipment: TemplateEquipment;
    daysPerWeek: number;
    exercises: TemplateExercise[];
    createdAt?: Timestamp;
}
