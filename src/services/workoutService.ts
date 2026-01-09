import {
    addDoc,
    collection,
    doc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    Unsubscribe,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { RoutineDay, RoutineExercise } from "../types/routine";
import { RoutineTemplate, TemplateEquipment } from "../types/routineTemplate";
import { UserProfile } from "../types/user";
import { WorkoutSession } from "../types/workout";
import { db } from "./firebaseConfig";
import { calculateRepRange } from "./logicEngine";

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

            // Fire-and-forget: Update analytics INCREMENTALLY (non-blocking, O(1))
            // We create the session object with a client-side timestamp for analytics
            import("./analyticsService")
                .then(({ AnalyticsService }) => {
                    const { Timestamp } = require("firebase/firestore");
                    const sessionWithTimestamp = {
                        ...session,
                        id: docRef.id,
                        performedAt: Timestamp.now(), // Use client timestamp for immediate analytics
                    };
                    console.log("[WorkoutService] Triggering incremental analytics update...");
                    AnalyticsService.updateFromSession(session.userId, sessionWithTimestamp).catch(err => {
                        console.warn("[WorkoutService] Analytics update failed:", err);
                    });
                })
                .catch(err => {
                    console.error("[WorkoutService] Failed to import analyticsService:", err);
                });

            return docRef.id;
        } catch (error) {
            console.error("Error creating workout session:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            throw error;
        }
    },


    /**
     * Subscribe to recent workout sessions for real-time updates
     */
    subscribeToRecentSessions(
        userId: string,
        limitCount: number = 10,
        callback: (sessions: WorkoutSession[]) => void
    ): Unsubscribe {
        try {
            const q = query(
                collection(db, "workoutSessions"),
                where("userId", "==", userId),
                orderBy("performedAt", "desc"),
                limit(limitCount)
            );

            return onSnapshot(q, (snapshot) => {
                const sessions = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as WorkoutSession[];
                callback(sessions);
            }, (error) => {
                console.error("Error subscribing to recent sessions:", error);
                // Don't modify state on error to avoid flickering
            });
        } catch (error) {
            console.error("Error setting up session subscription:", error);
            return () => { };
        }
    },

    /**
     * Get recent workout sessions for a user with a limit
     * Optimized for Home screen to prevent fetching entire history
     */
    async getRecentSessions(
        userId: string,
        limitCount: number = 10
    ): Promise<WorkoutSession[]> {
        try {
            const q = query(
                collection(db, "workoutSessions"),
                where("userId", "==", userId),
                orderBy("performedAt", "desc"),
                limit(limitCount)
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as WorkoutSession[];
        } catch (error) {
            console.error("Error fetching recent sessions:", error);
            return [];
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
        totalVolume7d: number;
    }> {
        try {
            const sessions = await this.getAllUserWorkoutSessions(userId);

            if (sessions.length === 0) {
                return { streak: 0, totalVolume7d: 0 };
            }

            const now = new Date();
            const oneDayMs = 24 * 60 * 60 * 1000;
            const sevenDaysAgo = new Date(now.getTime() - 7 * oneDayMs);

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

            // Calculate total volume (7 days)
            let totalVolume7d = 0;
            sessions.forEach(session => {
                const sessionDate = new Date(session.performedAt?.toMillis?.() || 0);
                if (sessionDate >= sevenDaysAgo) {
                    session.exercises.forEach(exercise => {
                        exercise.sets.forEach(set => {
                            totalVolume7d += set.weight * set.reps;
                        });
                    });
                }
            });

            return {
                streak,
                totalVolume7d: Math.round(totalVolume7d),
            };
        } catch (error) {
            console.error("Error calculating user metrics:", error);
            return { streak: 0, totalVolume7d: 0 };
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
                // If the day is not in the routine, it's a rest day.
                // MENS assumes a 7-day weekday structure (0=Mon...6=Sun).
                isRestDay = true;
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

    /**
     * Match a user to a routine template and assign it.
     */
    async assignRoutineFromTemplates(
        userId: string,
        userProfile: UserProfile,
        options: { translateKey?: (key: string) => string } = {}
    ): Promise<string | null> {
        try {
            // Helpers to map UserProfile to Template criteria


            const mapEquipment = (e: string | null | undefined): TemplateEquipment => {
                if (e === 'full_gym') return 'Gym Completo';
                return 'En casa-Sin equipo';
            };

            const targetEquipment = mapEquipment(userProfile.equipment);
            const targetDays = userProfile.daysPerWeek || 3;

            console.log(`Matching routine for: Eq=${targetEquipment}, Days=${targetDays}`);

            // Query Firestore
            const templatesRef = collection(db, "routines_templates");
            const q = query(
                templatesRef,
                where("equipment", "==", targetEquipment),
                where("daysPerWeek", "==", targetDays)
            );

            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                console.warn("No matching routine template found.");
                return null;
            }

            // Pick the first match
            const template = snapshot.docs[0].data() as RoutineTemplate;
            console.log("Found template:", template.name);

            const newRoutineId = await this.saveTemplateAsRoutine(userId, template, { translateKey: options.translateKey });
            return newRoutineId;
        } catch (error) {
            console.error("Error assigning routine:", error);
            return null;
        }
    },

    async saveTemplateAsRoutine(
        userId: string,
        template: RoutineTemplate,
        options: { onlyStructure?: boolean; translateKey?: (key: string) => string } = {}
    ): Promise<string> {
        const routineRef = doc(collection(db, "routines"));
        const days: RoutineDay[] = [];

        // Helper to translate or passthrough
        const t = options.translateKey || ((key: string) => key);

        // Create days from template structure
        template.days.forEach((tplDay, index) => {
            const routineDay: RoutineDay = {
                dayIndex: index,
                label: t(tplDay.name), // Translate day name
                exercises: []
            };

            // If not just structure, populate exercises
            if (!options.onlyStructure) {
                routineDay.exercises = tplDay.exercises.map((templateEx, exIndex) => {
                    const range = calculateRepRange(templateEx.type);

                    const routineEx: RoutineExercise = {
                        id: uuidv4(),
                        exerciseId: templateEx.id,
                        name: templateEx.name, // Keep as translation key for dynamic translation
                        targetZone: templateEx.targetZone,
                        sets: [],
                        reps: range.label, // "8-12"
                        restSeconds: templateEx.restSeconds,
                        order: exIndex
                    };

                    // Create Sets
                    const setList = [];
                    for (let s = 0; s < templateEx.sets; s++) {
                        setList.push({
                            setIndex: s,
                            targetReps: range.max, // Target the top of range
                        });
                    }
                    routineEx.sets = setList;

                    return routineEx;
                });
            }

            days.push(routineDay);
        });

        // Save
        const routine = {
            userId,
            name: t(template.name), // Translate routine name
            source: "ai" as const,
            isActive: true, // Make active immediately
            isCurrentPlan: true,
            isGeneratedForUser: true,
            daysPerWeek: template.daysPerWeek,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            days,
        };

        // Deactivate others
        const batch = writeBatch(db);
        const existingRoutinesRef = collection(db, "routines");
        const q = query(existingRoutinesRef, where("userId", "==", userId));
        const snapshot = await getDocs(q);

        snapshot.forEach((doc) => {
            batch.update(doc.ref, { isActive: false, isCurrentPlan: false });
        });

        // Add the new routine to the batch? No, setDoc is safer separately or add to batch.
        // Let's just commit the deactivation batch first or do it all in one.
        // For simplicity and matching previous style:
        if (!snapshot.empty) {
            await batch.commit();
        }

        await setDoc(routineRef, routine);

        return routineRef.id;
    },

    /**
     * Delete multiple workout sessions
     */
    async deleteWorkoutSessions(userId: string, sessionIds: string[]): Promise<void> {
        const batch = writeBatch(db);
        sessionIds.forEach(id => {
            const ref = doc(db, "workoutSessions", id);
            batch.delete(ref);
        });
        await batch.commit();

        // Trigger analytics recalculation
        import("./analyticsService").then(({ AnalyticsService }) => {
            AnalyticsService.recalculateUserAnalytics(userId).catch(console.error);
        });
    },

    /**
     * Update a workout session
     */
    async updateWorkoutSession(userId: string, sessionId: string, data: Partial<WorkoutSession>): Promise<void> {
        const ref = doc(db, "workoutSessions", sessionId);
        // Ensure durationSeconds is updated if present, otherwise keep existing
        await updateDoc(ref, {
            ...data,
            // If we are updating exercises, we might need to recalculate volume/duration if not provided
            // For now, trust the incoming data has everything needed
        });

        // Trigger analytics recalculation
        import("./analyticsService").then(({ AnalyticsService }) => {
            AnalyticsService.recalculateUserAnalytics(userId).catch(console.error);
        });
    }
};
