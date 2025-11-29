import {
    addDoc,
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    where
} from "firebase/firestore";
import { WorkoutSession } from "../types/workout";
import { db } from "./firebaseConfig";

export const WorkoutService = {
    /**
     * Create a new workout session
     */
    async createWorkoutSession(
        session: Omit<WorkoutSession, "id" | "performedAt">
    ): Promise<string> {
        const sessionsRef = collection(db, "workoutSessions");

        const docRef = await addDoc(sessionsRef, {
            ...session,
            performedAt: serverTimestamp(),
        });

        return docRef.id;
    },

    /**
     * Get all workout sessions for a specific routine
     */
    async getWorkoutSessionsByRoutine(
        userId: string,
        routineId: string
    ): Promise<WorkoutSession[]> {
        try {
            const q = query(
                collection(db, "workoutSessions"),
                where("userId", "==", userId),
                where("routineId", "==", routineId),
                orderBy("performedAt", "desc")
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as WorkoutSession[];
        } catch (error) {
            console.error("Error fetching workout sessions:", error);
            return [];
        }
    },

    /**
     * Get the last workout session for a specific routine and day
     */
    async getLastWorkoutSessionForRoutine(
        userId: string,
        routineId: string,
        dayIndex: number
    ): Promise<WorkoutSession | null> {
        try {
            const q = query(
                collection(db, "workoutSessions"),
                where("userId", "==", userId),
                where("routineId", "==", routineId),
                where("dayIndex", "==", dayIndex),
                orderBy("performedAt", "desc"),
                limit(1)
            );

            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;

            return {
                id: snapshot.docs[0].id,
                ...snapshot.docs[0].data(),
            } as WorkoutSession;
        } catch (error) {
            console.error("Error fetching last workout session:", error);
            return null;
        }
    },
};
