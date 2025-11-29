import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    UserCredential,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
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
