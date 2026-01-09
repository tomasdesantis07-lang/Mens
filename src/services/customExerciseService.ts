import { collection, doc, getDocs, orderBy, query, setDoc, Timestamp } from "firebase/firestore";
import { CatalogExercise } from "../types/exercise";
import { db } from "./firebaseConfig";

export const CustomExerciseService = {
    /**
     * Creates a new custom exercise for a specific user
     */
    createCustomExercise: async (userId: string, exerciseData: Omit<CatalogExercise, 'id'>): Promise<CatalogExercise> => {
        try {
            const exerciseId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const newExercise: CatalogExercise = {
                id: exerciseId,
                ...exerciseData
            };

            const userExerciseRef = doc(db, 'users', userId, 'custom_exercises', exerciseId);

            await setDoc(userExerciseRef, {
                ...newExercise,
                createdAt: Timestamp.now()
            });

            return newExercise;
        } catch (error) {
            console.error("Error creating custom exercise:", error);
            throw error;
        }
    },

    /**
     * Updates an existing custom exercise
     */
    updateCustomExercise: async (userId: string, exerciseId: string, exerciseData: Partial<CatalogExercise>): Promise<void> => {
        try {
            const userExerciseRef = doc(db, 'users', userId, 'custom_exercises', exerciseId);

            await setDoc(userExerciseRef, {
                ...exerciseData,
                updatedAt: Timestamp.now()
            }, { merge: true });

        } catch (error) {
            console.error("Error updating custom exercise:", error);
            throw error;
        }
    },

    /**
     * Gets all custom exercises for a specific user
     */
    getUserCustomExercises: async (userId: string): Promise<CatalogExercise[]> => {
        try {
            const customExercisesRef = collection(db, 'users', userId, 'custom_exercises');
            const q = query(customExercisesRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            const customExercises: CatalogExercise[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // We exclude createdAt from the returned object to match CatalogExercise type
                // or we could extend the type. For now, we just take the relevant fields.
                const { createdAt, updatedAt, ...exerciseData } = data;
                customExercises.push(exerciseData as CatalogExercise);
            });

            return customExercises;
        } catch (error) {
            console.error("Error fetching custom exercises:", error);
            return [];
        }
    }
};
