export type BodyZone =
    | "chest"
    | "back"
    | "legs"
    | "shoulders"
    | "arms"
    | "core"
    | "cardio"
    | "full_body";

export interface CatalogExercise {
    id: string;
    targetZone: BodyZone;
    equipment?: "dumbbell" | "barbell" | "machine" | "bodyweight" | "cable" | "other";
}
