import { useMutation, useQueryClient } from '@tanstack/react-query';
import { auth } from '../services/firebaseConfig';
import { RoutineService } from '../services/routineService';
import { Routine } from '../types/routine';

export function useDeleteRoutine() {
    const queryClient = useQueryClient();
    const userId = auth.currentUser?.uid;

    return useMutation({
        mutationFn: async (routineId: string) => {
            await RoutineService.deleteRoutine(routineId);
        },
        onMutate: async (routineId) => {
            // Cancel outgoing refetches to avoid overwriting our optimistic update
            await queryClient.cancelQueries({ queryKey: ['routines', userId] });

            // Snapshot the previous value
            const previousRoutines = queryClient.getQueryData<Routine[]>(['routines', userId]);

            // Optimistically update the cache
            if (previousRoutines) {
                queryClient.setQueryData<Routine[]>(
                    ['routines', userId],
                    previousRoutines.filter(routine => routine.id !== routineId)
                );
            }

            return { previousRoutines };
        },
        onError: (err, routineId, context) => {
            // Rollback on error
            if (context?.previousRoutines) {
                queryClient.setQueryData(['routines', userId], context.previousRoutines);
            }
        },
        onSettled: () => {
            // Unlikely to need refetch since real-time listener is active, but good practice for consistency
            // In hybrid mode, we might skip this to trust the listener, but it's safe to leave or omit
        },
    });
}
