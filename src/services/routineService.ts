import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";
import { Routine, RoutineDraft } from "../types/routine";
import { db } from "./firebaseConfig";

export const RoutineService = {
    /**
     * Sanitize routine data for Firestore (remove undefined values)
     */
    sanitizeRoutineForFirestore(draft: RoutineDraft) {
        return {
            ...draft,
            days: draft.days.map(day => ({
                ...day,
                exercises: day.exercises.map(exercise => ({
                    ...exercise,
                    sets: exercise.sets.map(set => ({
                        setIndex: set.setIndex,
                        // Only include targetWeight/targetReps if they have values
                        ...(set.targetWeight !== undefined && { targetWeight: set.targetWeight }),
                        ...(set.targetReps !== undefined && { targetReps: set.targetReps }),
                    })),
                    // Remove notes if undefined
                    ...(exercise.notes !== undefined && { notes: exercise.notes }),
                })),
            })),
        };
    },

    /**
     * Create a new routine from a draft
     * @returns The new routine's Firestore doc ID
     */
    async createRoutine(userId: string, draft: RoutineDraft): Promise<string> {
        const routineRef = doc(collection(db, "routines"));

        const sanitizedDraft = this.sanitizeRoutineForFirestore(draft);

        const routine = {
            userId,
            name: sanitizedDraft.name,
            source: "manual" as const,
            isActive: false,
            daysPerWeek: sanitizedDraft.days.filter((d) => d.exercises.length > 0).length,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            days: sanitizedDraft.days.filter((d) => d.exercises.length > 0), // Only save days with exercises
        };

        await setDoc(routineRef, routine);
        return routineRef.id;
    },

    /**
     * Update an existing routine
     */
    async updateRoutine(routineId: string, draft: RoutineDraft): Promise<void> {
        const routineRef = doc(db, "routines", routineId);

        const sanitizedDraft = this.sanitizeRoutineForFirestore(draft);

        await updateDoc(routineRef, {
            name: sanitizedDraft.name,
            days: sanitizedDraft.days.filter((d) => d.exercises.length > 0),
            daysPerWeek: sanitizedDraft.days.filter((d) => d.exercises.length > 0).length,
            updatedAt: serverTimestamp(),
        });
    },

    /**
     * Get all routines for a user (no orderBy to avoid composite index requirement)
     */
    async getUserRoutines(userId: string): Promise<Routine[]> {
        try {
            const q = query(
                collection(db, "routines"),
                where("userId", "==", userId)
            );

            const snapshot = await getDocs(q);
            const routines = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Routine[];

            // Sort by createdAt on client side
            return routines.sort((a, b) => {
                const aTime = a.createdAt?.toMillis() || 0;
                const bTime = b.createdAt?.toMillis() || 0;
                return bTime - aTime;
            });
        } catch (error) {
            console.error("Error fetching user routines:", error);
            return [];
        }
    },

    /**
     * Get a single routine by ID
     */
    async getRoutineById(routineId: string): Promise<Routine | null> {
        try {
            const docRef = doc(db, "routines", routineId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) return null;

            return {
                id: docSnap.id,
                ...docSnap.data(),
            } as Routine;
        } catch (error) {
            console.error("Error fetching routine:", error);
            return null;
        }
    },

    /**
     * Delete a routine
     */
    async deleteRoutine(routineId: string): Promise<void> {
        const routineRef = doc(db, "routines", routineId);
        await deleteDoc(routineRef);
    },

    /**
     * Set a routine as the active one for the user
     */
    async setActiveRoutine(userId: string, routineId: string): Promise<void> {
        // First, deactivate all user's routines
        const userRoutines = await this.getUserRoutines(userId);
        const batch = writeBatch(db);

        userRoutines.forEach((r) => {
            const ref = doc(db, "routines", r.id);
            batch.update(ref, { isActive: r.id === routineId });
        });

        await batch.commit();
    },

    /**
     * Get community routines (no orderBy to avoid composite index requirement)
     */
    async getCommunityRoutines(): Promise<Routine[]> {
        try {
            const routinesRef = collection(db, "routines");
            const q = query(
                routinesRef,
                where("userId", "==", "community")
            );

            const snapshot = await getDocs(q);
            const routines = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Routine[];

            // Sort by createdAt on client side
            return routines.sort((a, b) => {
                const aTime = a.createdAt?.toMillis() || 0;
                const bTime = b.createdAt?.toMillis() || 0;
                return bTime - aTime;
            });
        } catch (error) {
            console.error("Error fetching community routines:", error);
            return [];
        }
    },
};
