import {
    createUserWithEmailAndPassword,
    deleteUser,
    EmailAuthProvider,
    reauthenticateWithCredential,
    signInWithEmailAndPassword,
    UserCredential,
} from "firebase/auth";
import { collection, deleteDoc, doc, getDocs, query, serverTimestamp, setDoc, where, writeBatch } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

export const AuthService = {
    async register(email: string, password: string): Promise<UserCredential> {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const uid = cred.user.uid;

        const userRef = doc(db, "users", uid);
        await setDoc(
            userRef,
            {
                email: cred.user.email,
                createdAt: serverTimestamp(),
                isPremium: false,
                displayName: "",
                objective: null,
                daysPerWeek: null,
                level: null,
            },
            { merge: true }
        );
        return cred;
    },

    async login(email: string, password: string): Promise<UserCredential> {
        return signInWithEmailAndPassword(auth, email, password);
    },

    /**
     * Delete user account completely
     * This is a destructive, irreversible operation.
     * @param password - Required if user needs re-authentication (security sensitive action)
     */
    async deleteAccount(password?: string): Promise<void> {
        const user = auth.currentUser;
        if (!user) {
            throw new Error("No authenticated user found");
        }

        const deleteData = async () => {
            const userId = user.uid;

            // Step 1: Delete all user routines
            const routinesQuery = query(collection(db, "routines"), where("userId", "==", userId));
            const routinesSnapshot = await getDocs(routinesQuery);
            if (routinesSnapshot.docs.length > 0) {
                const batch = writeBatch(db);
                routinesSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
                await batch.commit();
            }

            // Step 2: Delete all user workouts
            const workoutsQuery = query(collection(db, "workouts"), where("userId", "==", userId));
            const workoutsSnapshot = await getDocs(workoutsQuery);
            if (workoutsSnapshot.docs.length > 0) {
                const batch = writeBatch(db);
                workoutsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
                await batch.commit();
            }

            // Step 3: Delete user document
            await deleteDoc(doc(db, "users", userId));
        };

        try {
            // Attempt to delete user directly first
            await deleteData();
            await deleteUser(user);
            console.log("[AuthService] Deleted Firebase Auth account");

        } catch (error: any) {
            console.error("[AuthService] Error deleting account:", error);

            // If requires recent login and we have password, try to reauthenticate
            if (error.code === "auth/requires-recent-login") {
                if (password && user.email) {
                    const credential = EmailAuthProvider.credential(user.email, password);
                    await reauthenticateWithCredential(user, credential);

                    // Retry deletion after reauth
                    await deleteData();
                    await deleteUser(user);
                    return;
                }
                throw new Error("Por seguridad, necesitamos validar tu contraseña nuevamente.");
            }

            throw error;
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
};
