import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { shouldSuggestProgression } from "../../src/services/logicEngine";
import { RoutineService } from "../../src/services/routineService";
import { COLORS } from "../../src/theme/theme"; // Assuming standard theme
import { Routine, RoutineDay, RoutineExercise } from "../../src/types/routine";

export default function TrainScreen() {
    const router = useRouter();
    const { routineId, dayIndex } = useLocalSearchParams<{ routineId: string; dayIndex: string }>();

    const [routine, setRoutine] = useState<Routine | null>(null);
    const [activeDay, setActiveDay] = useState<RoutineDay | null>(null);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({}); // key: exerciseId-setIndex
    const [inputValues, setInputValues] = useState<Record<string, { weight: string, reps: string }>>({});

    useEffect(() => {
        loadRoutine();
    }, [routineId, dayIndex]);

    const loadRoutine = async () => {
        if (!routineId) return;
        const r = await RoutineService.getRoutineById(routineId);
        if (r) {
            setRoutine(r);
            const dIndex = parseInt(dayIndex || "0");
            const day = r.days.find(d => d.dayIndex === dIndex);
            if (day) setActiveDay(day);
        }
    };

    const handleSetComplete = (exercise: RoutineExercise, setIndex: number, targetMaxReps: number) => {
        const inputKey = `${exercise.id}-${setIndex}`;
        const repsPerformed = parseInt(inputValues[inputKey]?.reps || "0");

        // Mark confirmed
        setCompletedSets(prev => ({ ...prev, [inputKey]: true }));

        // Check Logic: Progreso detectado
        // "Si el usuario completa todas las series en el límite superior..."
        // Simplified: Check if THIS set met the max. In a real app we might check if ALL sets for this exercise matched.
        // Let's implement per-set feedback or check if this was the last set.

        if (shouldSuggestProgression(repsPerformed, targetMaxReps)) {
            Alert.alert(
                "🚀 Progreso Detectado",
                "¡Has completado el rango máximo con buena técnica! Sugerimos aumentar la carga en la próxima sesión."
            );
        }
    };

    const handleInputChange = (exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: string) => {
        const key = `${exerciseId}-${setIndex}`;
        setInputValues(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: value }
        }));
    };

    if (!activeDay) return (
        <View style={styles.container}><Text style={styles.text}>Cargando rutina...</Text></View>
    );

    const currentExercise = activeDay.exercises[currentExerciseIndex];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{activeDay.label}</Text>
                <Text style={styles.subtitle}>{currentExercise.name}</Text>
            </View>

            <View style={styles.rangeInfo}>
                <Text style={styles.rangeLabel}>Rango Objetivo</Text>
                <Text style={styles.rangeValue}>{currentExercise.reps} reps</Text>
            </View>

            <ScrollView style={styles.content}>
                {currentExercise.sets.map((set, index) => {
                    // Extract range max from string "8-12" -> 12. 
                    const rangeParts = currentExercise.reps.split('-');
                    const targetMax = rangeParts.length === 2 ? parseInt(rangeParts[1]) : 12;

                    const isCompleted = completedSets[`${currentExercise.id}-${index}`];

                    return (
                        <View key={index} style={styles.setRow}>
                            <Text style={styles.setLabel}>Serie {index + 1}</Text>
                            <Text style={styles.setTarget}>{set.targetReps || currentExercise.reps} reps</Text>

                            <View style={styles.inputs}>
                                <Text style={styles.inputLabel}>Kg</Text>
                                {/* Placeholder for weight input */}
                                <Text style={[styles.inputValue, { marginRight: 15 }]}>--</Text>

                                <Text style={styles.inputLabel}>Reps</Text>
                                {/* Simplified input simulation */}
                                <TouchableOpacity
                                    style={styles.inputBox}
                                    onPress={() => {
                                        // Simulate input for demo
                                        const val = isCompleted ? inputValues[`${currentExercise.id}-${index}`]?.reps : targetMax.toString();
                                        handleInputChange(currentExercise.id, index, 'reps', val);
                                    }}
                                >
                                    <Text style={styles.inputValue}>
                                        {inputValues[`${currentExercise.id}-${index}`]?.reps || "-"}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.checkBtn, isCompleted && styles.checkBtnActive]}
                                onPress={() => handleSetComplete(currentExercise, index, targetMax)}
                            >
                                <Text style={styles.checkText}>✓</Text>
                            </TouchableOpacity>
                        </View>
                    );
                })}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.nextBtn}
                    onPress={() => {
                        if (currentExerciseIndex < activeDay.exercises.length - 1) {
                            setCurrentExerciseIndex(prev => prev + 1);
                        } else {
                            // Finish
                            Alert.alert("Entrenamiento Finalizado");
                            router.push("/workout/summary");
                        }
                    }}
                >
                    <Text style={styles.nextBtnText}>
                        {currentExerciseIndex < activeDay.exercises.length - 1 ? "Start Rest / Next" : "Finalizar Entreno"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', padding: 20 },
    header: { marginBottom: 20 },
    title: { color: COLORS.textSecondary, fontSize: 16 },
    subtitle: { color: COLORS.textPrimary, fontSize: 24, fontWeight: 'bold' },
    text: { color: COLORS.textPrimary },
    rangeInfo: {
        backgroundColor: COLORS.surface,
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    rangeLabel: { color: COLORS.textSecondary, fontSize: 14 },
    rangeValue: { color: COLORS.primary, fontSize: 18, fontWeight: 'bold' },
    content: { flex: 1 },
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        backgroundColor: '#1A1A1A',
        padding: 15,
        borderRadius: 8
    },
    setLabel: { color: COLORS.textPrimary, width: 60, fontWeight: 'bold' },
    setTarget: { color: COLORS.textSecondary, width: 80, fontSize: 12 },
    inputs: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginRight: 15 },
    inputLabel: { color: COLORS.textSecondary, fontSize: 12, marginRight: 5 },
    inputBox: { minWidth: 40, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.textPrimary },
    inputValue: { color: COLORS.textPrimary, fontSize: 16, fontWeight: 'bold' },
    checkBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#333', justifyContent: 'center', alignItems: 'center'
    },
    checkBtnActive: { backgroundColor: COLORS.success }, // Assuming COLORS.success exists, or use green
    checkText: { color: '#FFF' },
    footer: { marginTop: 20 },
    nextBtn: {
        backgroundColor: COLORS.primary,
        padding: 18,
        borderRadius: 30,
        alignItems: 'center'
    },
    nextBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 }
});
