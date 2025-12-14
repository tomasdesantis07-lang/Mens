import { Timestamp } from "firebase/firestore";

export interface UserBiometrics {
    age: number | null;
    weight: number | null; // kg
    height: number | null; // cm
    gender: 'male' | 'female' | null;
}

export interface UserProfile {
    email: string;
    createdAt: Timestamp;
    isPremium: boolean;
    displayName: string;
    username: string; // @username

    // New structured data
    biometrics: UserBiometrics;
    experienceLevel: 'beginner' | 'intermediate' | 'advanced' | null;
    goals: ('strength' | 'hypertrophy' | 'weight_loss' | 'health')[];
    injuries: ('shoulders' | 'knees' | 'lower_back' | 'wrists' | 'none')[];

    // Legacy/Service compatibility fields (kept for easier integration with existing services)
    objective: string | null; // Primary objective
    daysPerWeek: number | null;
    level: string | null; // Mapped from experienceLevel
}
