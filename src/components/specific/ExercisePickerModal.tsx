import { Activity, Dumbbell, Filter, PlusCircle, Search, X } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    FlatList,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EXERCISE_CATALOG } from "../../data/exerciseCatalog";
import { COLORS } from "../../theme/theme";
import { BodyPartSlug } from "../../types/bodyParts";
import { CatalogExercise } from "../../types/exercise";
import { BodyHeatmap } from "../stats/BodyHeatmap";

interface ExercisePickerModalProps {
    visible: boolean;
    onSelect: (exercise: CatalogExercise, translatedName: string) => void;
    onCustomExercise: () => void;
    onClose: () => void;
    recommendedExercises?: CatalogExercise[];
}

const getEquipmentIcon = (equipment: string) => {
    switch (equipment) {
        case 'cardio':
            return Activity;
        default:
            return Dumbbell;
    }
};

export const ExercisePickerModal: React.FC<ExercisePickerModalProps> = ({
    visible,
    onSelect,
    onCustomExercise,
    onClose,
    recommendedExercises,
}) => {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState("");
    const [isBodyFilterVisible, setIsBodyFilterVisible] = useState(false);
    const [selectedMuscles, setSelectedMuscles] = useState<BodyPartSlug[]>([]);

    // Reset state when modal opens/closes
    React.useEffect(() => {
        if (visible) {
            // If we have recommendations, don't reset. Otherwise clear.
            if (!recommendedExercises || recommendedExercises.length === 0) {
                setSelectedMuscles([]);
                setIsBodyFilterVisible(false);
            }
        }
    }, [visible, recommendedExercises]);

    const handleMuscleSelect = (muscle: BodyPartSlug) => {
        setSelectedMuscles(prev => {
            if (prev.includes(muscle)) {
                return prev.filter(m => m !== muscle);
            } else {
                return [...prev, muscle];
            }
        });
    };

    const clearFilters = () => {
        setSelectedMuscles([]);
    };

    // Filter exercises based on selected muscles
    const filteredByCategory = useMemo(() => {
        // If we have recommendations and no manual filters, show recommendations
        if (recommendedExercises && recommendedExercises.length > 0 && selectedMuscles.length === 0 && !isBodyFilterVisible) {
            return recommendedExercises;
        }

        // If no muscles selected, show all
        if (selectedMuscles.length === 0) {
            return EXERCISE_CATALOG;
        }

        // Filter by selected muscles
        return EXERCISE_CATALOG.filter(ex =>
            ex.primaryMuscles.some(muscle => selectedMuscles.includes(muscle))
        );
    }, [selectedMuscles, recommendedExercises, isBodyFilterVisible]);

    // Further filter by search query
    const filteredExercises = useMemo(() => {
        const withTranslations = filteredByCategory.map(ex => ({
            ...ex,
            displayName: t(`exercises.${ex.id}`)
        }));

        if (!searchQuery) return withTranslations;

        const query = searchQuery.toLowerCase();
        return withTranslations.filter(ex =>
            ex.displayName.toLowerCase().includes(query)
        );
    }, [searchQuery, filteredByCategory, t]);

    const renderItem = ({ item }: { item: CatalogExercise & { displayName: string } }) => {
        const Icon = getEquipmentIcon(item.equipment);
        const subtitle = `${t(`equipment.${item.equipment}`)} • ${t(`mechanic.${item.mechanic}`)}`;

        return (
            <TouchableOpacity
                style={styles.exerciseCard}
                onPress={() => onSelect(item, item.displayName)}
            >
                {/* Icon Box */}
                <View style={styles.iconBox}>
                    <Icon color={COLORS.primary} size={24} />
                </View>

                {/* Info */}
                <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{item.displayName}</Text>
                    <Text style={styles.exerciseSubtitle}>{subtitle}</Text>
                </View>

                {/* Action */}
                <PlusCircle color={COLORS.primary} size={24} />
            </TouchableOpacity>
        );
    };

    const hasActiveFilters = selectedMuscles.length > 0;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>{t('exercise_picker.title')}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X color={COLORS.textPrimary} size={24} />
                    </TouchableOpacity>
                </View>

                {/* Search Bar + Filter Button */}
                <View style={styles.searchRow}>
                    <View style={styles.searchContainer}>
                        <Search color={COLORS.textSecondary} size={20} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={t('exercise_picker.search_placeholder')}
                            placeholderTextColor={COLORS.textTertiary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery("")}>
                                <X color={COLORS.textSecondary} size={16} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            (isBodyFilterVisible || hasActiveFilters) && styles.filterButtonActive
                        ]}
                        onPress={() => setIsBodyFilterVisible(!isBodyFilterVisible)}
                    >
                        <Filter size={20} color={(isBodyFilterVisible || hasActiveFilters) ? COLORS.textInverse : COLORS.textSecondary} />
                        {hasActiveFilters && (
                            <View style={styles.filterBadge}>
                                <Text style={styles.filterBadgeText}>{selectedMuscles.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Body Filter (Collapsible) */}
                {isBodyFilterVisible && (
                    <View style={styles.bodyFilterContainer}>
                        <BodyHeatmap
                            mode="selector"
                            selectedMuscles={selectedMuscles}
                            onMuscleSelect={handleMuscleSelect}
                        />
                        {hasActiveFilters && (
                            <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                                <Text style={styles.clearFiltersText}>{t('exercise_picker.clear_filters') || 'Limpiar filtros'}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Recommendations Badge (only when showing recommendations) */}
                {recommendedExercises && recommendedExercises.length > 0 && selectedMuscles.length === 0 && !isBodyFilterVisible && (
                    <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedBadgeText}>
                            {t('exercise_picker.showing_recommended') || 'Mostrando sugerencias'}
                        </Text>
                    </View>
                )}

                {/* Exercise List */}
                <FlatList
                    data={filteredExercises}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>
                                {t('exercise_picker.no_results')}
                            </Text>
                        </View>
                    }
                />

                {/* Custom Exercise Button */}
                <View style={styles.customButtonContainer}>
                    <TouchableOpacity
                        style={styles.customButton}
                        onPress={onCustomExercise}
                    >
                        <Text style={styles.customButtonText}>
                            {t('exercise_picker.custom_exercise')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },
    closeButton: {
        padding: 4,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginTop: 16,
        gap: 12,
    },
    searchContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        paddingHorizontal: 12,
        borderRadius: 12,
        height: 48,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: COLORS.textPrimary,
        height: "100%",
    },
    filterButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    filterButtonActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: COLORS.error,
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
    bodyFilterContainer: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    clearFiltersButton: {
        marginTop: 12,
        alignItems: 'center',
    },
    clearFiltersText: {
        color: COLORS.error,
        fontWeight: '600',
        fontSize: 14,
    },
    recommendedBadge: {
        backgroundColor: COLORS.primary + '20',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 8,
    },
    recommendedBadgeText: {
        color: COLORS.primary,
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
    listContent: {
        paddingVertical: 16,
    },
    exerciseCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 8,
        backgroundColor: COLORS.surface,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    exerciseInfo: {
        flex: 1,
    },
    exerciseName: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    exerciseSubtitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    emptyState: {
        padding: 40,
        alignItems: "center",
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 16,
    },
    customButtonContainer: {
        padding: 16,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.background,
    },
    customButton: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.primary,
        borderStyle: "dashed",
        paddingVertical: 16,
        alignItems: "center",
    },
    customButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.primary,
    },
});
