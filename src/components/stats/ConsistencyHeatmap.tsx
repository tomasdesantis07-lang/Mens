import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { G, Path } from "react-native-svg";
import { BODY_BACK_DATA, BODY_FRONT_DATA } from "../../data/bodyPartsData";
import { COLORS } from "../../theme/theme";
import { BodyPart, BodyPartSlug } from "../../types/bodyParts";
import { MuscleId } from "../../types/muscles";

interface ConsistencyHeatmapProps {
    data: Map<string, number>;
    muscleData: Record<string, number>;
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

export const ConsistencyHeatmap: React.FC<ConsistencyHeatmapProps> = ({ data, muscleData }) => {
    const { t } = useTranslation();
    const [bodyView, setBodyView] = useState<"anterior" | "posterior">("anterior");

    const weeks: string[][] = [];
    const now = new Date();

    for (let weekIndex = 5; weekIndex >= 0; weekIndex--) {
        const week: string[] = [];
        for (let dayIndex = 6; dayIndex >= 0; dayIndex--) {
            const daysBack = weekIndex * 7 + dayIndex;
            const date = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
            week.push(date.toISOString().split('T')[0]);
        }
        weeks.push(week.reverse());
    }

    const getIntensityColor = (intensity: number): string => {
        if (intensity === 0) return COLORS.surface;
        if (intensity <= 0.25) return COLORS.primary + '40';
        if (intensity <= 0.5) return COLORS.primary + '80';
        return COLORS.primary;
    };

    const getWorkoutIntensityColor = (count: number): string => {
        if (count === 0) return COLORS.surface;
        if (count === 1) return COLORS.primary + '40';
        if (count === 2) return COLORS.primary + '80';
        return COLORS.primary;
    };

    const getMuscleIntensityColor = (muscleId: MuscleId | null): string => {
        if (!muscleId) return COLORS.surface;
        const intensity = muscleData[muscleId] || 0;
        return getIntensityColor(intensity);
    };

    const renderBodyParts = (parts: BodyPart[], currentView: 'anterior' | 'posterior') => {
        return parts.map((part, index) => {
            const muscleId = mapSlugToMuscleId(part.slug, currentView);
            const color = getMuscleIntensityColor(muscleId);

            const allPaths = [
                ...(part.path.common || []),
                ...(part.path.left || []),
                ...(part.path.right || [])
            ];

            return (
                <G key={`${part.slug}-${index}`}>
                    {allPaths.map((d, i) => (
                        <Path
                            key={i}
                            d={d}
                            fill={color}
                            stroke={COLORS.border}
                            strokeWidth="0.5"
                        />
                    ))}
                </G>
            );
        });
    };

    const dayLabels = t('stats.day_initials', { returnObjects: true }) as string[];

    return (
        <View style={styles.container}>
            {/* Header with title and week count badge */}
            <View style={styles.headerRow}>
                <Text style={styles.mainTitle}>{t('stats.summary').toUpperCase()}</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>6 {t('stats.weeks')}</Text>
                </View>
            </View>

            {/* Two-column layout */}
            <View style={styles.content}>
                {/* Left Column: Calendar */}
                <View style={styles.leftColumn}>
                    <Text style={styles.sectionLabel}>Entrenamientos</Text>

                    <View style={styles.calendarWrapper}>
                        <View style={styles.dayLabelsColumn}>
                            {dayLabels.map((label, index) => (
                                <Text key={index} style={styles.dayLabel}>{label}</Text>
                            ))}
                        </View>

                        <View style={styles.grid}>
                            {weeks.map((week, weekIndex) => (
                                <View key={weekIndex} style={styles.column}>
                                    {week.map((dateKey) => {
                                        const count = data.get(dateKey) || 0;
                                        return (
                                            <View
                                                key={dateKey}
                                                style={[
                                                    styles.cell,
                                                    { backgroundColor: getWorkoutIntensityColor(count) }
                                                ]}
                                            />
                                        );
                                    })}
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Vertical divider */}
                <View style={styles.divider} />

                {/* Right Column: Body Heatmap */}
                <View style={styles.rightColumn}>
                    <View style={styles.bodyHeaderRow}>
                        <Text style={styles.sectionLabel}>Actividad Muscular</Text>
                    </View>

                    {/* SVG Body */}
                    <View style={styles.svgWrapper}>
                        <Svg
                            height="240"
                            width="170"
                            viewBox={bodyView === "anterior" ? "100 100 600 1300" : "900 100 600 1300"}
                        >
                            {bodyView === "anterior"
                                ? renderBodyParts(BODY_FRONT_DATA, "anterior")
                                : renderBodyParts(BODY_BACK_DATA, "posterior")
                            }
                        </Svg>
                    </View>

                    {/* Toggle below SVG */}
                    <View style={styles.toggleWrapper}>
                        <View style={styles.toggleContainer}>
                            <TouchableOpacity
                                style={[styles.toggleButton, bodyView === "anterior" && styles.activeToggle]}
                                onPress={() => setBodyView("anterior")}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.toggleDot, bodyView === "anterior" && styles.activeDot]} />
                                <Text style={[styles.toggleText, bodyView === "anterior" && styles.activeToggleText]}>
                                    {t('stats.front')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toggleButton, bodyView === "posterior" && styles.activeToggle]}
                                onPress={() => setBodyView("posterior")}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.toggleDot, bodyView === "posterior" && styles.activeDot]} />
                                <Text style={[styles.toggleText, bodyView === "posterior" && styles.activeToggleText]}>
                                    {t('stats.back')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>

            {/* Unified Legend */}
            <View style={styles.footer}>
                <Text style={styles.legendTitle}>Intensidad</Text>
                <View style={styles.legendBar}>
                    <Text style={styles.legendEndLabel}>Baja</Text>
                    <View style={styles.legendColors}>
                        <View style={[styles.legendCell, { backgroundColor: COLORS.surface }]} />
                        <View style={[styles.legendCell, { backgroundColor: COLORS.primary + '40' }]} />
                        <View style={[styles.legendCell, { backgroundColor: COLORS.primary + '80' }]} />
                        <View style={[styles.legendCell, { backgroundColor: COLORS.primary }]} />
                    </View>
                    <Text style={styles.legendEndLabel}>Alta</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    mainTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.textPrimary,
        letterSpacing: 1.2,
    },
    badge: {
        backgroundColor: COLORS.background,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: "600",
        color: COLORS.textSecondary,
        letterSpacing: 0.3,
    },
    content: {
        flexDirection: 'row',
        gap: 24,
    },
    leftColumn: {
        flex: 1,
    },
    rightColumn: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: "600",
        color: COLORS.textSecondary,
        marginBottom: 12,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    calendarWrapper: {
        flexDirection: "row",
        gap: 10,
    },
    dayLabelsColumn: {
        justifyContent: "space-around",
        paddingVertical: 3,
    },
    dayLabel: {
        fontSize: 10,
        color: COLORS.textTertiary,
        fontWeight: "600",
        width: 14,
        textAlign: "center",
    },
    grid: {
        flexDirection: "row",
        gap: 4,
    },
    column: {
        gap: 4,
    },
    cell: {
        width: 14,
        height: 14,
        borderRadius: 3,
        borderWidth: 1,
        borderColor: COLORS.border + '40',
    },
    divider: {
        width: 1,
        backgroundColor: COLORS.border + '60',
        marginVertical: 8,
        marginHorizontal: 12,
    },
    bodyHeaderRow: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 12,
    },
    toggleWrapper: {
        marginTop: 16,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.background,
        borderRadius: 20,
        padding: 3,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 17,
        gap: 6,
    },
    activeToggle: {
        backgroundColor: COLORS.primary,
    },
    toggleDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.textTertiary,
    },
    activeDot: {
        backgroundColor: COLORS.textInverse,
    },
    toggleText: {
        fontSize: 11,
        color: COLORS.textSecondary,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    activeToggleText: {
        color: COLORS.textInverse,
    },
    svgWrapper: {
        height: 240,
        width: 170,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
        marginHorizontal: 8,
    },
    footer: {
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.border + '40',
        alignItems: 'center',
    },
    legendTitle: {
        fontSize: 10,
        fontWeight: "600",
        color: COLORS.textSecondary,
        marginBottom: 10,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    legendBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    legendEndLabel: {
        fontSize: 10,
        color: COLORS.textTertiary,
        fontWeight: "500",
    },
    legendColors: {
        flexDirection: "row",
        gap: 4,
    },
    legendCell: {
        width: 28,
        height: 8,
        borderRadius: 4,
        borderWidth: 0.5,
        borderColor: COLORS.border + '50',
    },
});
