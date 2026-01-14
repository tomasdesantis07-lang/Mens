import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Unsubscribe } from 'firebase/firestore';
import { useEffect } from 'react';
import { auth } from '../services/firebaseConfig';
import { RoutineService } from '../services/routineService';

export function useRoutines() {
    const queryClient = useQueryClient();
    const userId = auth.currentUser?.uid;

    const { data: routines = [], isLoading, error } = useQuery({
        queryKey: ['routines', userId],
        queryFn: () => {
            if (!userId) return Promise.resolve([]);
            return RoutineService.getUserRoutines(userId);
        },
        enabled: !!userId,
        staleTime: Infinity, // Rely on real-time listener for updates
    });

    useEffect(() => {
        if (!userId) return;

        let unsubscribe: Unsubscribe | undefined;

        try {
            // Subscribe to real-time changes
            unsubscribe = RoutineService.subscribeToUserRoutines(userId, (data) => {
                // Update the Query Cache directly
                queryClient.setQueryData(['routines', userId], data);
            });
        } catch (err) {
            console.error("Error subscribing to routines:", err);
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [userId, queryClient]);

    // Ensure routines is ALWAYS an array to prevent .map crashes
    const safeRoutines = Array.isArray(routines) ? routines : [];

    return { routines: safeRoutines, loading: isLoading, error };
}
