import { Timestamp } from "firebase/firestore";

export interface UserProfile {
    email: string;
    createdAt: Timestamp;
    isPremium: boolean;
    displayName: string;
    objective: string | null;
    daysPerWeek: number | null;
    level: string | null;
}
