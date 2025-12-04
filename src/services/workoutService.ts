import {
    addDoc,
    collection,
    getDocs,
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
        try {
            console.log("Creating workout session with data:", JSON.stringify(session, null, 2));

            const sessionsRef = collection(db, "workoutSessions");

            const docRef = await addDoc(sessionsRef, {
                ...session,
                performedAt: serverTimestamp(),
            });

            console.log("Workout session created successfully with ID:", docRef.id);
            return docRef.id;
        } catch (error) {
            console.error("Error creating workout session:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            throw error;
        }
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
                where("routineId", "==", routineId)
            );

            const snapshot = await getDocs(q);
            const sessions = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as WorkoutSession[];

            // Sort by performedAt on client side (newest first)
            return sessions.sort((a, b) => {
                const aTime = a.performedAt?.toMillis?.() || 0;
                const bTime = b.performedAt?.toMillis?.() || 0;
                return bTime - aTime;
            });
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
                where("dayIndex", "==", dayIndex)
            );

            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;

            const sessions = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as WorkoutSession[];

            // Sort by performedAt on client side and get the most recent
            sessions.sort((a, b) => {
                const aTime = a.performedAt?.toMillis?.() || 0;
                const bTime = b.performedAt?.toMillis?.() || 0;
                return bTime - aTime;
            });

            return sessions[0] || null;
        } catch (error) {
            console.error("Error fetching last workout session:", error);
            return null;
        }
    },
};
