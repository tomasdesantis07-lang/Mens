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
    }> {
        try {
            const sessions = await this.getAllUserWorkoutSessions(userId);

            if (sessions.length === 0) {
                return { streak: 0, totalVolume30d: 0 };
            }

            const now = new Date();
            const oneDayMs = 24 * 60 * 60 * 1000;
            const thirtyDaysAgo = new Date(now.getTime() - 30 * oneDayMs);

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

            return {
                streak,
                totalVolume30d: Math.round(totalVolume30d),
            };
        } catch (error) {
            console.error("Error calculating user metrics:", error);
            return { streak: 0, totalVolume30d: 0 };
        }
    },

    /**
     * Get the workout that should be done today based on actual day of week
     * Monday = 0, Tuesday = 1, ..., Sunday = 6
     */
    async getWorkoutForToday(userId: string): Promise<{
        routineId: string;
        dayIndex: number;
        isRestDay: boolean;
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

            // Get today's day of week (JavaScript: Sunday=0, Monday=1, ..., Saturday=6)
            // We want: Monday=0, Tuesday=1, ..., Sunday=6
            const jsDay = new Date().getDay();
            const todayDayIndex = jsDay === 0 ? 6 : jsDay - 1; // Convert to Monday=0 format

            // Check if this day has exercises (is not a rest day)
            const todayRoutineDay = currentRoutine.days.find(d => d.dayIndex === todayDayIndex);

            // Determine if today is a rest day:
            // - If the routine explicitly has this day defined, check if it has exercises
            // - If the day is NOT in the routine, check if routine uses full weekday structure
            let isRestDay = false;
            if (todayRoutineDay) {
                // Routine explicitly has this day
                isRestDay = todayRoutineDay.exercises.length === 0;
            } else {
                // Day not in routine - only mark as rest if routine uses full 7-day weekday structure
                // This handles backward compatibility with old routines that only have days 0, 1, 2...
                const maxDayIndex = Math.max(...currentRoutine.days.map(d => d.dayIndex));
                const hasWeekendDays = currentRoutine.days.some(d => d.dayIndex >= 5);

                // If routine has weekend days (5=Sat, 6=Sun) or spans full week, use weekday logic
                if (hasWeekendDays || maxDayIndex >= 6) {
                    isRestDay = true; // Missing day = rest day
                } else {
                    // Old routine without weekday structure - not a rest day for messaging purposes
                    isRestDay = false;
                }
            }

            return {
                routineId: currentRoutine.id,
                dayIndex: todayDayIndex,
                isRestDay,
            };
        } catch (error) {
            console.error("Error getting workout for today:", error);
            return null;
        }
    },

    /**
     * Get comprehensive user statistics for the stats dashboard
     */
    async getUserStats(userId: string): Promise<{
        consistency: number[]; // Array of timestamps for heatmap
        weeklyVolume: { week: string; volume: number }[]; // Last 8 weeks
        maxStreak: number; // Best historical streak
    }> {
        try {
            const sessions = await this.getAllUserWorkoutSessions(userId);

            // Calculate consistency (timestamps for last 3 months)
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

            const consistency = sessions
                .filter((session) => {
                    const sessionDate = session.performedAt?.toDate();
                    return sessionDate && sessionDate >= threeMonthsAgo;
                })
                .map((session) => session.performedAt?.toMillis() || 0)
                .filter((timestamp) => timestamp > 0);

            // Calculate weekly volume for last 8 weeks
            const now = new Date();
            const weeklyVolume: { week: string; volume: number }[] = [];

            for (let i = 7; i >= 0; i--) {
                const weekStart = new Date(now);
                weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
                weekStart.setHours(0, 0, 0, 0);

                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 7);

                const weekSessions = sessions.filter((session) => {
                    const sessionDate = session.performedAt?.toDate();
                    return sessionDate && sessionDate >= weekStart && sessionDate < weekEnd;
                });

                let totalVolume = 0;
                weekSessions.forEach((session) => {
                    session.exercises.forEach((exercise) => {
                        exercise.sets.forEach((set) => {
                            totalVolume += (set.weight || 0) * (set.reps || 0);
                        });
                    });
                });

                // Format week label
                const weekLabel = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
                weeklyVolume.push({ week: weekLabel, volume: Math.round(totalVolume) });
            }

            // Calculate max streak
            let maxStreak = 0;
            let currentStreakCount = 0;
            let lastWorkoutDate: Date | null = null;

            const sortedSessions = [...sessions].sort((a, b) => {
                const aTime = a.performedAt?.toMillis() || 0;
                const bTime = b.performedAt?.toMillis() || 0;
                return aTime - bTime;
            });

            sortedSessions.forEach((session) => {
                const sessionDate = session.performedAt?.toDate();
                if (!sessionDate) return;

                if (lastWorkoutDate) {
                    const daysDiff = Math.floor(
                        (sessionDate.getTime() - lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24)
                    );

                    if (daysDiff <= 2) {
                        // Within streak window (allowing 1 rest day)
                        const sameWeek =
                            Math.floor(sessionDate.getTime() / (7 * 24 * 60 * 60 * 1000)) ===
                            Math.floor(lastWorkoutDate.getTime() / (7 * 24 * 60 * 60 * 1000));

                        if (!sameWeek) {
                            currentStreakCount++;
                        }
                    } else {
                        // Streak broken
                        maxStreak = Math.max(maxStreak, currentStreakCount);
                        currentStreakCount = 1;
                    }
                } else {
                    currentStreakCount = 1;
                }

                lastWorkoutDate = sessionDate;
            });

            maxStreak = Math.max(maxStreak, currentStreakCount);

            return {
                consistency,
                weeklyVolume,
                maxStreak,
            };
        } catch (error) {
            console.error("Error calculating user stats:", error);
            return {
                consistency: [],
                weeklyVolume: [],
                maxStreak: 0,
            };
        }
    },
};
