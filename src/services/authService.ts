import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createUserWithEmailAndPassword,
    deleteUser,
    EmailAuthProvider,
    reauthenticateWithCredential,
    signInWithEmailAndPassword,
    UserCredential,
} from "firebase/auth";
import { collection, deleteDoc, doc, getDocs, query, where, writeBatch } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

export const AuthService = {
    async register(email: string, password: string): Promise<UserCredential> {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        // We do NOT create the user document here anymore. 
        // It will be created at the end of the Onboarding Data Tunnel.
        return cred;
    },

    async login(email: string, password: string): Promise<UserCredential> {
        return signInWithEmailAndPassword(auth, email, password);
    },

    /**
     * Check if a username is already in use
     * @param username - The username to check (with or without @)
     * @returns true if available, false if taken
     */
    async checkUsernameAvailable(username: string): Promise<boolean> {
        // Normalize username (ensure it starts with @)
        const normalizedUsername = username.startsWith('@') ? username : `@${username}`;

        const usersQuery = query(
            collection(db, "users"),
            where("username", "==", normalizedUsername)
        );
        const snapshot = await getDocs(usersQuery);
        return snapshot.empty;
    },

    /**
     * Delete user account completely
     * This is a destructive, irreversible operation.
     * @param password - Required for re-authentication (security sensitive action)
     */
    async deleteAccount(password?: string): Promise<void> {
        const user = auth.currentUser;
        if (!user) {
            throw new Error("No authenticated user found");
        }

        const userId = user.uid;
        console.log(`[AuthService] Starting account deletion for user: ${userId}`);

        // Step 0: Re-authenticate first if password is provided
        if (password && user.email) {
            try {
                const credential = EmailAuthProvider.credential(user.email, password);
                await reauthenticateWithCredential(user, credential);
                console.log("[AuthService] Re-authenticated successfully");
            } catch (authError: any) {
                console.error("[AuthService] Re-authentication failed:", authError);
                if (authError.code === "auth/wrong-password" || authError.code === "auth/invalid-credential") {
                    throw new Error("Contraseña incorrecta. Por favor, verificá e intentá de nuevo.");
                }
                throw authError;
            }
        }

        try {
            // Step 1: Clean up routines
            await this.deleteUserCollectionData("routines", userId);

            // Step 2: Clean up modern workout sessions
            await this.deleteUserCollectionData("workoutSessions", userId);

            // Step 3: Clean up legacy workouts (just in case)
            await this.deleteUserCollectionData("workouts", userId);

            // Step 4: Clean up user analytics
            try {
                await deleteDoc(doc(db, "user_analytics", userId));
                console.log("[AuthService] Deleted user analytics");
            } catch (e) {
                console.warn("[AuthService] Could not delete analytics (maybe doesn't exist):", e);
            }

            // Step 5: Clean up custom exercises (subcollection of users)
            await this.deleteUserCollectionData(`users/${userId}/custom_exercises`, userId);

            // Step 6: Delete user document
            await deleteDoc(doc(db, "users", userId));
            console.log("[AuthService] Deleted user profile document");

            // Step 7: Finally delete the Firebase Auth account
            await deleteUser(user);
            console.log("[AuthService] Deleted Firebase Auth account");

            // Step 8: Clean local data
            await this.cleanLocalData();

        } catch (error: any) {
            console.error("[AuthService] Failed at some step of account deletion:", error);

            if (error.code === "auth/requires-recent-login") {
                throw new Error("Por seguridad, necesitamos validar tu contraseña nuevamente.");
            }
            throw error;
        }
    },

    /**
     * Helper to delete all documents in a collection belonging to a user
     */
    async deleteUserCollectionData(collectionPath: string, userId: string): Promise<void> {
        try {
            const q = query(collection(db, collectionPath), where("userId", "==", userId));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const batch = writeBatch(db);
                snapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref));
                await batch.commit();
                console.log(`[AuthService] Deleted ${snapshot.docs.length} documents from ${collectionPath}`);
            }
        } catch (error) {
            console.warn(`[AuthService] Non-critical error deleting ${collectionPath}:`, error);
            // We don't throw here to allow other deletions to proceed, 
            // but the "Missing or insufficient permissions" might still bubble up if it's the main error.
        }
    },

    getErrorMessage(err: any): string {
        return err?.code === "auth/invalid-email"
            ? "Email inválido."
            : err?.code === "auth/wrong-password"
                ? "Contraseña incorrecta."
                : err?.code === "auth/user-not-found"
                    ? "No existe un usuario con ese email."
                    : err?.code === "auth/email-already-in-use"
                        ? "Ya existe una cuenta con ese email."
                        : "Error al autenticar. Revisá los datos.";
    },

    /**
     * Clears all local application data (AsyncStorage)
     * Useful for logout or account deletion
     */
    async cleanLocalData(): Promise<void> {
        try {
            // Option 1: Clear everything (Safest for "reset")
            // await AsyncStorage.clear();

            // Option 2: Clear specific keys (if we want to keep some device-specific flags like "hasSeenOnboarding" - though for this user request we want a full reset)
            // For now, let's clear all known keys to ensure fresh start
            const keys = await AsyncStorage.getAllKeys();
            await AsyncStorage.multiRemove(keys);
            console.log("[AuthService] Local data cleared");
        } catch (error) {
            console.error("[AuthService] Error clearing local data:", error);
        }
    },
};
