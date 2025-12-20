import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { G, Path } from "react-native-svg";
import { BODY_BACK_DATA, BODY_FRONT_DATA } from "../../data/bodyPartsData";
import { COLORS } from "../../theme/theme";
import { BodyPartSlug } from "../../types/bodyParts";
import { MuscleId } from "../../types/muscles";

interface BodyHeatmapProps {
    data?: Record<string, number>;
    mode?: 'heatmap' | 'selector';
    selectedMuscles?: BodyPartSlug[];
    onMuscleSelect?: (muscle: BodyPartSlug) => void;
}

const mapSlugToMuscleId = (slug: BodyPartSlug, view: 'anterior' | 'posterior'): MuscleId | null => {
    switch (slug) {
        case 'chest': return 'chest';
        case 'abs': return 'abs';
        case 'obliques': return 'obliques';
        case 'biceps': return 'biceps';
        case 'triceps': return 'triceps';
        case 'forearm': return 'forearms';
        case 'trapezius': return 'traps';
        case 'deltoids': return view === 'anterior' ? 'shoulders-front' : 'shoulders-back';
        case 'lower-back': return 'lower-back';
        case 'quadriceps': return 'quads';
        case 'hamstring': return 'hamstrings';
        case 'gluteal': return 'glutes';
        case 'calves': return 'calves';
        case 'head': return 'head';
        case 'upper-back': return 'lats';
        default: return null;
    }
};

const BodyHeatmapComponent: React.FC<BodyHeatmapProps> = ({
    data = {},
    mode = 'heatmap',
    selectedMuscles = [],
    onMuscleSelect
}) => {
    const [view, setView] = useState<"anterior" | "posterior">("anterior");

    const getMuscleColor = (slug: BodyPartSlug, view: 'anterior' | 'posterior'): string => {
        if (mode === 'selector') {
            return selectedMuscles.includes(slug) ? COLORS.primary : COLORS.surface;
        }

        // Heatmap mode
        const muscleId = mapSlugToMuscleId(slug, view);
        if (!muscleId) return COLORS.surface;

        const intensity = data[muscleId] || 0;
        if (intensity === 0) return COLORS.surface;

        const opacity = 0.3 + (intensity * 0.7);
        return `rgba(41, 98, 255, ${opacity})`;
    };

    // Memoize body part rendering to avoid recalculating on every render
    const frontBodyParts = useMemo(() => {
        return BODY_FRONT_DATA.map((part, index) => {
            const color = getMuscleColor(part.slug, "anterior");

            const allPaths = [
                ...(part.path.common || []),
                ...(part.path.left || []),
                ...(part.path.right || [])
            ];

            return (
                <G
                    key={`${part.slug}-${index}`}
                    onPress={() => mode === 'selector' && onMuscleSelect?.(part.slug)}
                >
                    {allPaths.map((d, i) => (
                        <Path
                            key={i}
                            d={d}
                            fill={color}
                            stroke={COLORS.border}
                            strokeWidth="1"
                        />
                    ))}
                </G>
            );
        });
    }, [data, mode, selectedMuscles, onMuscleSelect]);

    const backBodyParts = useMemo(() => {
        return BODY_BACK_DATA.map((part, index) => {
            const color = getMuscleColor(part.slug, "posterior");

            const allPaths = [
                ...(part.path.common || []),
                ...(part.path.left || []),
                ...(part.path.right || [])
            ];

            return (
                <G
                    key={`${part.slug}-${index}`}
                    onPress={() => mode === 'selector' && onMuscleSelect?.(part.slug)}
                >
                    {allPaths.map((d, i) => (
                        <Path
                            key={i}
                            d={d}
                            fill={color}
                            stroke={COLORS.border}
                            strokeWidth="1"
                        />
                    ))}
                </G>
            );
        });
    }, [data, mode, selectedMuscles, onMuscleSelect]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                {mode === 'heatmap' && <Text style={styles.title}>Mapa de Calor Corporal</Text>}
                <View style={[styles.toggleContainer, mode === 'selector' && { marginLeft: 'auto', marginRight: 'auto' }]}>
                    <TouchableOpacity
                        style={[styles.toggleButton, view === "anterior" && styles.activeToggle]}
                        onPress={() => setView("anterior")}
                    >
                        <Text style={[styles.toggleText, view === "anterior" && styles.activeToggleText]}>Frente</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleButton, view === "posterior" && styles.activeToggle]}
                        onPress={() => setView("posterior")}
                    >
                        <Text style={[styles.toggleText, view === "posterior" && styles.activeToggleText]}>Espalda</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.svgContainer}>
                <Svg height="400" width="300" viewBox={view === "anterior" ? "100 100 600 1300" : "900 100 600 1300"}>
                    {view === "anterior" ? frontBodyParts : backBodyParts}
                </Svg>
            </View>

            {mode === 'heatmap' && (
                <View style={styles.legend}>
                    <Text style={styles.legendText}>Intensidad:</Text>
                    <View style={[styles.legendColor, { backgroundColor: COLORS.surface }]} />
                    <Text style={styles.legendLabel}>0%</Text>
                    <View style={[styles.legendColor, { backgroundColor: 'rgba(41, 98, 255, 0.3)' }]} />
                    <Text style={styles.legendLabel}>30%</Text>
                    <View style={[styles.legendColor, { backgroundColor: 'rgba(41, 98, 255, 1.0)' }]} />
                    <Text style={styles.legendLabel}>100%</Text>
                </View>
            )}
        </View>
    );
};

// Memoized export to prevent unnecessary re-renders of complex SVG
export const BodyHeatmap = React.memo(BodyHeatmapComponent);

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 16,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.background,
        borderRadius: 20,
        padding: 2,
    },
    toggleButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 18,
    },
    activeToggle: {
        backgroundColor: COLORS.primary,
    },
    toggleText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    activeToggleText: {
        color: COLORS.textInverse,
    },
    svgContainer: {
        height: 400,
        width: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        gap: 8,
    },
    legendText: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    legendColor: {
        width: 12,
        height: 12,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    legendLabel: {
        fontSize: 10,
        color: COLORS.textTertiary,
    },
});
