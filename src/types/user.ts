import { Timestamp } from "firebase/firestore";

export interface UserBiometrics {
    birthDate: string | null; // ISO date string (YYYY-MM-DD)
    weight: number | null; // kg
    height: number | null; // cm
    gender: 'male' | 'female' | null;
}

export type ExperienceLevel =
    | 'newcomer'      // Iniciado (<2 months)
    | 'beginner'      // Principiante (2-6 months)
    | 'intermediate'  // Intermedio (6-12 months)
    | 'advanced'      // Base sólida (1-3 years)
    | 'expert';       // Experimentado (+3 years)

export type UserGoal =
    | 'recomp'        // Recomposición
    | 'strength'      // Fuerza Máxima
    | 'endurance';    // Resistencia/Complemento

export type AcquisitionSource =
    | 'instagram'
    | 'tiktok'
    | 'youtube'
    | 'google'
    | 'friend'
    | 'other'
    | null;

export type Equipment =
    | 'full_gym'      // Gimnasio completo
    | 'home_weights'  // En casa con pesas / mancuernas
    | 'bodyweight';   // Con peso corporal

export type PosturalProblem =
    | 'scoliosis'     // Escoliosis
    | 'kyphosis'      // Cifosis
    | 'hyperlordosis' // Hiperlordosis
    | 'none';         // No lo sé / Muy leve

export interface UserProfile {
    email: string;
    createdAt: Timestamp;
    isPremium: boolean;
    displayName: string;
    username: string; // @username

    // New structured data
    biometrics: UserBiometrics;
    experienceLevel: ExperienceLevel | null;
    goals: UserGoal[];
    equipment: Equipment | null;
    injuries: ('shoulders' | 'knees' | 'lower_back' | 'wrists' | 'none')[];
    posturalProblems: PosturalProblem[];
    acquisitionSource?: AcquisitionSource;

    // Legacy/Service compatibility fields (kept for easier integration with existing services)
    objective: string | null; // Primary objective mapped for internal logic
    daysPerWeek: number | null;
    level: string | null; // Mapped from experienceLevel to 'beginner'|'intermediate'|'advanced'
}
