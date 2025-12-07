import {
    addDoc,
    collection,
    getDocs,
    query,
    serverTimestamp,
    where
} from "firebase/firestore";
import { WorkoutSession } from "../types/workout";
import { db } from "./firebaseConfig";

export const WorkoutService = {
    /**
     * Create a new workout session
     */
    async createWorkoutSession(
        session: Omit<WorkoutSession, "id" | "performedAt">
    ): Promise<string> {
        try {
            console.log("Creating workout session with data:", JSON.stringify(session, null, 2));

            const sessionsRef = collection(db, "workoutSessions");

            const docRef = await addDoc(sessionsRef, {
                ...session,
                performedAt: serverTimestamp(),
            });

            console.log("Workout session created successfully with ID:", docRef.id);
            return docRef.id;
        } catch (error) {
            console.error("Error creating workout session:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            throw error;
        }
    },

    /**
     * Get all workout sessions for a specific routine
     */
    async getWorkoutSessionsByRoutine(
        userId: string,
        routineId: string
    ): Promise<WorkoutSession[]> {
        try {
            const q = query(
                collection(db, "workoutSessions"),
                where("userId", "==", userId),
                where("routineId", "==", routineId)
            );

            const snapshot = await getDocs(q);
            const sessions = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as WorkoutSession[];

            // Sort by performedAt on client side (newest first)
            return sessions.sort((a, b) => {
                const aTime = a.performedAt?.toMillis?.() || 0;
                const bTime = b.performedAt?.toMillis?.() || 0;
                return bTime - aTime;
            });
        } catch (error) {
            console.error("Error fetching workout sessions:", error);
            return [];
        }
    },

    /**
     * Get the last workout session for a specific routine and day
     */
    async getLastWorkoutSessionForRoutine(
        userId: string,
        routineId: string,
        dayIndex: number
    ): Promise<WorkoutSession | null> {
        try {
            const q = query(
                collection(db, "workoutSessions"),
                where("userId", "==", userId),
                where("routineId", "==", routineId),
                where("dayIndex", "==", dayIndex)
            );

            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;

            const sessions = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as WorkoutSession[];

            // Sort by performedAt on client side and get the most recent
            sessions.sort((a, b) => {
                const aTime = a.performedAt?.toMillis?.() || 0;
                const bTime = b.performedAt?.toMillis?.() || 0;
                return bTime - aTime;
            });

            return sessions[0] || null;
        } catch (error) {
            console.error("Error fetching last workout session:", error);
            return null;
        }
    },

    /**
     * Get all workout sessions for a user (for statistics)
     */
    async getAllUserWorkoutSessions(userId: string): Promise<WorkoutSession[]> {
        try {
            const q = query(
                collection(db, "workoutSessions"),
                where("userId", "==", userId)
            );

            const snapshot = await getDocs(q);
            const sessions = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as WorkoutSession[];

            // Sort by performedAt on client side (oldest first for progression analysis)
            return sessions.sort((a, b) => {
                const aTime = a.performedAt?.toMillis?.() || 0;
                const bTime = b.performedAt?.toMillis?.() || 0;
                return aTime - bTime;
            });
        } catch (error) {
            console.error("Error fetching all user workout sessions:", error);
            return [];
        }
    },

    /**
     * Calculate user metrics for statistics
     */
    async calculateUserMetrics(userId: string): Promise<{
        streak: number;
        totalVolume30d: number;
        weeklyImprovementPercent: number;
    }> {
        try {
            const sessions = await this.getAllUserWorkoutSessions(userId);

            if (sessions.length === 0) {
                return { streak: 0, totalVolume30d: 0, weeklyImprovementPercent: 0 };
            }

            const now = new Date();
            const oneDayMs = 24 * 60 * 60 * 1000;
            const thirtyDaysAgo = new Date(now.getTime() - 30 * oneDayMs);
            const sevenDaysAgo = new Date(now.getTime() - 7 * oneDayMs);
            const fourteenDaysAgo = new Date(now.getTime() - 14 * oneDayMs);

            // Calculate streak (consecutive days with workouts)
            let streak = 0;
            const sortedSessions = [...sessions].sort((a, b) => {
                const aTime = a.performedAt?.toMillis?.() || 0;
                const bTime = b.performedAt?.toMillis?.() || 0;
                return bTime - aTime; // newest first
            });

            const workoutDates = new Set<string>();
            sortedSessions.forEach(session => {
                const date = new Date(session.performedAt?.toMillis?.() || 0);
                workoutDates.add(date.toISOString().split('T')[0]);
            });

            const sortedDates = Array.from(workoutDates).sort().reverse();
            let checkDate = new Date(now);
            checkDate.setHours(0, 0, 0, 0);

            for (const dateStr of sortedDates) {
                const workoutDate = new Date(dateStr);
                const diffDays = Math.floor((checkDate.getTime() - workoutDate.getTime()) / oneDayMs);

                if (diffDays === streak) {
                    streak++;
                } else if (diffDays > streak) {
                    break;
                }
            }

            // Calculate total volume (30 days)
            let totalVolume30d = 0;
            sessions.forEach(session => {
                const sessionDate = new Date(session.performedAt?.toMillis?.() || 0);
                if (sessionDate >= thirtyDaysAgo) {
                    session.exercises.forEach(exercise => {
                        exercise.sets.forEach(set => {
                            totalVolume30d += set.weight * set.reps;
                        });
                    });
                }
            });

            // Calculate weekly improvement
            let currentWeekVolume = 0;
            let previousWeekVolume = 0;

            sessions.forEach(session => {
                const sessionDate = new Date(session.performedAt?.toMillis?.() || 0);
                const volume = session.exercises.reduce((acc, exercise) => {
                    return acc + exercise.sets.reduce((setAcc, set) => {
                        return setAcc + (set.weight * set.reps);
                    }, 0);
                }, 0);

                if (sessionDate >= sevenDaysAgo) {
                    currentWeekVolume += volume;
                } else if (sessionDate >= fourteenDaysAgo && sessionDate < sevenDaysAgo) {
                    previousWeekVolume += volume;
                }
            });

            const weeklyImprovementPercent = previousWeekVolume > 0
                ? ((currentWeekVolume - previousWeekVolume) / previousWeekVolume) * 100
                : 0;

            return {
                streak,
                totalVolume30d: Math.round(totalVolume30d),
                weeklyImprovementPercent: Math.round(weeklyImprovementPercent * 10) / 10, // 1 decimal
            };
        } catch (error) {
            console.error("Error calculating user metrics:", error);
            return { streak: 0, totalVolume30d: 0, weeklyImprovementPercent: 0 };
        }
    },

    /**
     * Get the workout that should be done today
     */
    async getWorkoutForToday(userId: string): Promise<{
        routineId: string;
        dayIndex: number;
    } | null> {
        try {
            const { RoutineService } = await import('./routineService');
            const userRoutines = await RoutineService.getUserRoutines(userId);

            // Find current plan
            let currentRoutine = userRoutines.find(r => r.isCurrentPlan);

            // If no current plan, use the most recently trained routine
            if (!currentRoutine) {
                const allSessions = await this.getAllUserWorkoutSessions(userId);
                if (allSessions.length > 0) {
                    const lastSession = allSessions[allSessions.length - 1];
                    currentRoutine = userRoutines.find(r => r.id === lastSession.routineId);
                }
            }

            // If still no routine, use the first one
            if (!currentRoutine) {
                currentRoutine = userRoutines[0];
            }

            if (!currentRoutine) {
                return null;
            }

            // Find last session for this routine
            const sessions = await this.getWorkoutSessionsByRoutine(userId, currentRoutine.id);

            let nextDayIndex = 0;
            if (sessions.length > 0) {
                const lastSession = sessions[0]; // Already sorted newest first
                const lastDayIndex = lastSession.dayIndex;
                const totalDays = currentRoutine.days.length;
                nextDayIndex = (lastDayIndex + 1) % totalDays;
            }

            return {
                routineId: currentRoutine.id,
                dayIndex: nextDayIndex,
            };
        } catch (error) {
            console.error("Error getting workout for today:", error);
            return null;
        }
    },
};
