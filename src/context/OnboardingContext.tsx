import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import i18n from 'i18next';
import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { Country } from '../data/countries';
import { auth, db } from '../services/firebaseConfig';
import { RoutineService } from '../services/routineService';
import { WorkoutService } from '../services/workoutService';

import { AcquisitionSource, Equipment, ExperienceLevel, PosturalProblem, UserBiometrics, UserGoal } from '../types/user';

interface OnboardingState {
    // Step 1: Identity
    firstName: string;
    lastName: string; // Not strictly required by UI but good for "Name" logic if we split it, otherwise just displayName
    displayName: string; // Full name or nickname
    username: string;

    // Step 2: Biometrics
    biometrics: UserBiometrics;

    // Step 3: Routine & Preferences (Collected for "Smart" assignment)
    experienceLevel: ExperienceLevel | null;
    daysPerWeek: number | null;
    goals: UserGoal[];
    equipment: Equipment | null;
    injuries: ('shoulders' | 'knees' | 'lower_back' | 'wrists' | 'none')[];
    posturalProblems: PosturalProblem[];
    acquisitionSource: AcquisitionSource;
    country: Country | null;

    // New Step 3: Specific Routine Selection
    selectedRoutineTemplateId: string | null;
    isTemplateOnly: boolean;

    // Internal flags
    healthCompleted: boolean;
}

const INITIAL_STATE: OnboardingState = {
    firstName: '',
    lastName: '',
    displayName: '',
    username: '@',
    biometrics: { birthDate: null, weight: null, height: null, gender: null },
    experienceLevel: null,
    daysPerWeek: null,
    goals: [],
    equipment: null,
    injuries: [],
    posturalProblems: [],
    acquisitionSource: null,
    country: null,
    selectedRoutineTemplateId: null,
    isTemplateOnly: false,
    healthCompleted: true, // Default true, unless they skip the "medical" part if we had one
};

interface OnboardingContextType {
    data: OnboardingState;
    updateData: (updates: Partial<OnboardingState>) => void;
    resetData: () => void;
    saveAndFinish: (options?: { skipRoutineAssignment?: boolean }) => Promise<void>;
    isSaving: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
    const [data, setData] = useState<OnboardingState>(INITIAL_STATE);
    const [isSaving, setIsSaving] = useState(false);
    const previousUserIdRef = useRef<string | null>(null);

    // Reset onboarding data when user logs out or changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            const currentUserId = user?.uid || null;

            // If user changed (logged out, deleted, or different user logged in)
            if (previousUserIdRef.current !== null && previousUserIdRef.current !== currentUserId) {
                console.log('[OnboardingContext] User changed, resetting data');
                setData(INITIAL_STATE);
            }

            previousUserIdRef.current = currentUserId;
        });

        return () => unsubscribe();
    }, []);

    const updateData = (updates: Partial<OnboardingState>) => {
        setData(prev => ({ ...prev, ...updates }));
    };

    const resetData = () => {
        setData(INITIAL_STATE);
    };

    const saveAndFinish = async (options?: { skipRoutineAssignment?: boolean }): Promise<void> => {
        const { skipRoutineAssignment = false } = options || {};
        const user = auth.currentUser;
        if (!user) throw new Error("No authenticated user found during save.");

        setIsSaving(true);
        try {
            // Logic from old OnboardingScreen.handleSave

            // Legacy mapping
            let level: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
            if (data.experienceLevel === 'newcomer' || data.experienceLevel === 'beginner') level = 'beginner';
            else if (data.experienceLevel === 'intermediate') level = 'intermediate';
            else level = 'advanced';

            let objective: 'muscle' | 'fat_loss' | 'strength' = 'fat_loss';
            if (data.goals.includes('recomp')) objective = 'fat_loss';
            else if (data.goals.includes('strength')) objective = 'strength';
            else objective = 'muscle';

            const isoBirthDate = data.biometrics.birthDate?.replace(/ \/ /g, '-') || null;
            const biometricsForStorage = {
                ...data.biometrics,
                birthDate: isoBirthDate
            };

            // 1. Create User File
            await setDoc(doc(db, "users", user.uid), {
                displayName: data.displayName,
                username: data.username,
                biometrics: biometricsForStorage,
                experienceLevel: data.experienceLevel,
                daysPerWeek: data.daysPerWeek,
                goals: data.goals,
                equipment: data.equipment,
                injuries: data.injuries,
                posturalProblems: data.posturalProblems,
                acquisitionSource: data.acquisitionSource || 'other',
                country: data.country ? data.country.code : null,

                // Legacy
                objective,
                level,
                healthCompleted: data.healthCompleted, // Meaning they finished the flow
                createdAt: new Date(),
                isPremium: false,
            }, { merge: true });

            // 2. Create/Assign Routine
            if (data.selectedRoutineTemplateId && !skipRoutineAssignment) {
                // New Flow: Specific Template Selection
                try {
                    const template = await RoutineService.getRoutineTemplateById(data.selectedRoutineTemplateId);
                    if (template) {
                        // Pass i18n.t to translate keys before saving
                        await WorkoutService.saveTemplateAsRoutine(
                            user.uid,
                            template,
                            {
                                onlyStructure: data.isTemplateOnly,
                                translateKey: (key: string) => i18n.t(key)
                            }
                        );
                    } else {
                        console.error("Selected template not found:", data.selectedRoutineTemplateId);
                    }
                } catch (e) {
                    console.error("Error creating routine from template:", e);
                }

            } else if (data.daysPerWeek && !skipRoutineAssignment) {
                // Legacy Smart Engine Flow
                const tempProfile: any = {
                    experienceLevel: data.experienceLevel,
                    goals: data.goals,
                    equipment: data.equipment,
                    daysPerWeek: data.daysPerWeek,
                    level: level,
                };

                try {
                    const assignedRoutineId = await WorkoutService.assignRoutineFromTemplates(
                        user.uid,
                        tempProfile,
                        { translateKey: (key: string) => i18n.t(key) }
                    );

                    if (!assignedRoutineId) {
                        console.warn("Smart Engine found no match, falling back to legacy RoutineService.");
                        await RoutineService.createAndAssignStarterRoutine(
                            user.uid,
                            data.daysPerWeek,
                            objective,
                            level
                        );
                    }
                } catch (routineError) {
                    console.error("Error creating routine, but user profile saved. Allowing proceed.", routineError);
                }
            }
        } catch (error) {
            console.error("Error in saveAndFinish:", error);
            throw error;
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <OnboardingContext.Provider value={{ data, updateData, resetData, saveAndFinish, isSaving }}>
            {children}
        </OnboardingContext.Provider>
    );
};

export const useOnboarding = () => {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
};
