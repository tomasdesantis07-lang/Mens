import { BodyPartSlug } from "./bodyParts";

export type Equipment = 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'kettlebell' | 'band' | 'cardio' | 'smith_machine';
export type Mechanic = 'compound' | 'isolation';
export type ForceType = 'push' | 'pull' | 'static' | 'hinge' | 'squat';

export interface CatalogExercise {
    id: string;
    nameKey: string; // ID para i18n
    primaryMuscles: BodyPartSlug[];
    secondaryMuscles: BodyPartSlug[];
    equipment: Equipment;
    mechanic: Mechanic;
    force?: ForceType;
    // Futuro: imageSource?: any;
}
