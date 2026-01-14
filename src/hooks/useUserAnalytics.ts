import { useQuery, useQueryClient } from "@tanstack/react-query";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { useEffect } from "react";
import { auth, db } from "../services/firebaseConfig";
import { UserAnalyticsSummary } from "../types/analytics";

interface UseUserAnalyticsResult {
    analytics: UserAnalyticsSummary | null;
    loading: boolean;
    error: string | null;
}

/**
 * Real-time hook for user analytics data (Cached via TanStack Query)
 */
export const useUserAnalytics = (): UseUserAnalyticsResult => {
    const queryClient = useQueryClient();
    const userId = auth.currentUser?.uid;

    const { data: analytics = null, isLoading, error } = useQuery({
        queryKey: ['userAnalytics', userId],
        queryFn: async () => {
            if (!userId) return null;
            // Basic fetch for cache population, real-time listener takes over immediately
            const docRef = doc(db, "user_analytics", userId);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? (docSnap.data() as UserAnalyticsSummary) : null;
        },
        enabled: !!userId,
        staleTime: Infinity,
    });

    useEffect(() => {
        if (!userId) return;

        const analyticsRef = doc(db, "user_analytics", userId);

        const unsubscribe = onSnapshot(
            analyticsRef,
            (docSnap) => {
                if (docSnap.exists()) {
                    queryClient.setQueryData(['userAnalytics', userId], docSnap.data());
                } else {
                    queryClient.setQueryData(['userAnalytics', userId], null);
                }
            },
            (err) => {
                // Ignore permission errors on logout
                if (auth.currentUser) {
                    console.error("[useUserAnalytics] Error:", err);
                }
            }
        );

        return () => unsubscribe();
    }, [userId, queryClient]);

    return {
        analytics,
        loading: isLoading,
        error: error ? error.message : null
    };
};
