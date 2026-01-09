import { Unsubscribe } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { auth } from '../services/firebaseConfig';
import { WorkoutService } from '../services/workoutService';
import { WorkoutSession } from '../types/workout';

export function useRecentWorkouts(limitCount: number = 10) {
    const [recentSessions, setRecentSessions] = useState<WorkoutSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const userId = auth.currentUser?.uid;

        if (!userId) {
            setRecentSessions([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        let unsubscribe: Unsubscribe | undefined;

        try {
            unsubscribe = WorkoutService.subscribeToRecentSessions(userId, limitCount, (data) => {
                setRecentSessions(data);
                setLoading(false);
            });
        } catch (err) {
            console.error("Error subscribing to recent sessions:", err);
            setError(err instanceof Error ? err : new Error('Unknown error'));
            setLoading(false);
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [limitCount]);

    return { recentSessions, loading, error };
}
