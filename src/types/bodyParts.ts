export type BodyPartSlug =
    | "chest" | "obliques" | "abs" | "biceps" | "triceps" | "forearm"
    | "trapezius" | "deltoids" | "upper-back" | "lower-back" | "lats"
    | "adductors" | "quadriceps" | "hamstring" | "gluteal" | "calves" | "tibialis"
    | "knees" | "ankles" | "feet" | "hands" | "neck" | "head" | "hair";

export interface BodyPartPath {
    common?: string[];
    left?: string[];
    right?: string[];
}

export interface BodyPart {
    slug: BodyPartSlug;
    color: string;
    path: BodyPartPath;
}
