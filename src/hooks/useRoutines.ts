import { Unsubscribe } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { auth } from '../services/firebaseConfig';
import { RoutineService } from '../services/routineService';
import { Routine } from '../types/routine';

export function useRoutines() {
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const userId = auth.currentUser?.uid;

        if (!userId) {
            setRoutines([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        let unsubscribe: Unsubscribe | undefined;

        try {
            unsubscribe = RoutineService.subscribeToUserRoutines(userId, (data) => {
                setRoutines(data);
                setLoading(false);
            });
        } catch (err) {
            console.error("Error subscribing to routines:", err);
            setError(err instanceof Error ? err : new Error('Unknown error'));
            setLoading(false);
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    return { routines, loading, error };
}
