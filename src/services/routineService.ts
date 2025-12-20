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
import { templateToRoutineDays } from "../data/starterRoutineTemplates";
import { Routine, RoutineDraft } from "../types/routine";
import { getRecommendedTemplate, UserGoal, UserLevel } from "../utils/routineRecommendation";
import { db } from "./firebaseConfig";

export const RoutineService = {
    /**
     * Sanitize routine data for Firestore (remove undefined values)
     */
    sanitizeRoutineForFirestore(draft: RoutineDraft) {
        // Helper to remove undefined values from an object
        const removeUndefined = <T extends Record<string, any>>(obj: T): T => {
            const result = {} as T;
            for (const key in obj) {
                if (obj[key] !== undefined) {
                    result[key] = obj[key];
                }
            }
            return result;
        };

        return {
            name: draft.name,
            days: draft.days.map(day => ({
                dayIndex: day.dayIndex,
                label: day.label,
                exercises: day.exercises.map(exercise => removeUndefined({
                    id: exercise.id,
                    exerciseId: exercise.exerciseId,
                    targetZone: exercise.targetZone,
                    name: exercise.name,
                    sets: exercise.sets.map(set => removeUndefined({
                        setIndex: set.setIndex,
                        targetWeight: set.targetWeight,
                        targetReps: set.targetReps,
                    })),
                    reps: exercise.reps,
                    restSeconds: exercise.restSeconds,
                    notes: exercise.notes,
                    order: exercise.order,
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
            isCurrentPlan: false,
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
     * Set a routine as the current plan (only one can be active at a time)
     */
    async setRoutineAsCurrent(userId: string, routineId: string): Promise<void> {
        const userRoutines = await this.getUserRoutines(userId);
        const batch = writeBatch(db);

        userRoutines.forEach((r) => {
            const ref = doc(db, "routines", r.id);
            batch.update(ref, { isCurrentPlan: r.id === routineId });
        });

        await batch.commit();
    },

    /**
     * Create and assign a starter routine based on user's onboarding data
     * This is the MENS System entry point - automatically creates the first routine
     */
    async createAndAssignStarterRoutine(
        userId: string,
        days: number,
        goal: UserGoal,
        level: UserLevel
    ): Promise<string> {
        // Step 1: Get the recommended template from MENS engine
        const template = getRecommendedTemplate({
            daysAvailable: days,
            goal,
            level,
        });

        // Step 2: Convert template to routine days
        const templateDays = templateToRoutineDays(template);

        // Step 3: Create the routine object
        const routineRef = doc(collection(db, "routines"));
        const routine = {
            userId,
            name: template.nameKey, // Store the i18n key, will be translated in UI
            source: "ai" as const, // Mark as AI-generated (MENS System)
            isActive: true,
            isCurrentPlan: true,
            isGeneratedForUser: true, // Tag as generated for "For You" badge
            daysPerWeek: template.daysPerWeek,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            days: templateDays,
        };

        // Step 4: Deactivate all existing routines first
        const existingRoutines = await this.getUserRoutines(userId);
        if (existingRoutines.length > 0) {
            const batch = writeBatch(db);
            existingRoutines.forEach((r) => {
                const ref = doc(db, "routines", r.id);
                batch.update(ref, { isActive: false, isCurrentPlan: false });
            });
            await batch.commit();
        }

        // Step 5: Save the new routine
        await setDoc(routineRef, routine);

        return routineRef.id;
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

    /**
     * Save a routine generated by AI
     * Sanitizes the draft and marks it with proper AI flags
     * 
     * @param userId - The user's Firebase UID
     * @param aiDraft - The RoutineDraft generated by AIService
     * @param setAsActive - Whether to set this as the active routine (default: false)
     * @returns The new routine's Firestore doc ID
     */
    async saveAIRoutine(
        userId: string,
        aiDraft: RoutineDraft,
        setAsActive: boolean = false
    ): Promise<string> {
        const routineRef = doc(collection(db, "routines"));

        // Use existing sanitizer to clean data
        const sanitizedDraft = this.sanitizeRoutineForFirestore(aiDraft);

        // Calculate days with actual exercises
        const activeDays = sanitizedDraft.days.filter((d) => d.exercises.length > 0);

        const routine = {
            userId,
            name: sanitizedDraft.name,
            source: "ai" as const,           // Mark as AI-generated
            isActive: setAsActive,
            isCurrentPlan: setAsActive,
            isGeneratedForUser: true,        // Flag for "For You" badge
            daysPerWeek: activeDays.length,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            days: activeDays,
        };

        // If setting as active, deactivate other routines first
        if (setAsActive) {
            const existingRoutines = await this.getUserRoutines(userId);
            if (existingRoutines.length > 0) {
                const batch = writeBatch(db);
                existingRoutines.forEach((r) => {
                    const ref = doc(db, "routines", r.id);
                    batch.update(ref, { isActive: false, isCurrentPlan: false });
                });
                await batch.commit();
            }
        }

        await setDoc(routineRef, routine);

        console.log("[RoutineService] AI routine saved:", routineRef.id);
        return routineRef.id;
    },
};
