import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "../services/firebaseConfig";
import { UserAnalyticsSummary } from "../types/analytics";

interface UseUserAnalyticsResult {
    analytics: UserAnalyticsSummary | null;
    loading: boolean;
    error: string | null;
}

/**
 * Real-time hook for user analytics data
 * Listens to the user_analytics/{userId} document in Firestore
 */
export const useUserAnalytics = (): UseUserAnalyticsResult => {
    const [analytics, setAnalytics] = useState<UserAnalyticsSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const userId = auth.currentUser?.uid;

        if (!userId) {
            setLoading(false);
            setAnalytics(null);
            return;
        }

        let unsubscribe: (() => void) | null = null;

        const setupListener = async () => {
            try {
                // First check if user document exists (might be in onboarding still)
                const userDocRef = doc(db, "users", userId);
                const userDocSnap = await getDoc(userDocRef);

                if (!userDocSnap.exists()) {
                    // User is still in onboarding, don't set up analytics listener
                    setLoading(false);
                    setAnalytics(null);
                    return;
                }

                // User exists, set up real-time listener for analytics
                const analyticsRef = doc(db, "user_analytics", userId);

                unsubscribe = onSnapshot(
                    analyticsRef,
                    (docSnap) => {
                        if (docSnap.exists()) {
                            setAnalytics(docSnap.data() as UserAnalyticsSummary);
                        } else {
                            // Document doesn't exist yet (new user)
                            setAnalytics(null);
                        }
                        setLoading(false);
                        setError(null);
                    },
                    (err) => {
                        // Only log error if user is still authenticated
                        // Permission errors after logout/delete are expected
                        if (auth.currentUser) {
                            console.error("[useUserAnalytics] Error:", err);
                            setError(err.message);
                        }
                        setLoading(false);
                    }
                );
            } catch (err: any) {
                console.error("[useUserAnalytics] Setup error:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        setupListener();

        // Cleanup listener on unmount
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    return { analytics, loading, error };
};
