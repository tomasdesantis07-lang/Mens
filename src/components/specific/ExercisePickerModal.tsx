import { FlashList } from "@shopify/flash-list";
import { Activity, Check, Dumbbell, Pencil, Search, X } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EXERCISE_CATALOG } from "../../data/exerciseCatalog";
import { COLORS } from "../../theme/theme";
import { BodyPartSlug } from "../../types/bodyParts";
import { CatalogExercise } from "../../types/exercise";

const TypedFlashList = FlashList as any;

interface ExercisePickerModalProps {
    visible: boolean;
    onSelect: (exercises: Array<{ exercise: CatalogExercise, translatedName: string }>) => void;
    onCustomExercise: () => void;
    onEditCustomExercise?: (exercise: CatalogExercise) => void;
    onClose: () => void;
    recommendedExercises?: CatalogExercise[];
    customExercises?: CatalogExercise[];
    multiSelect?: boolean;
}

import { MUSCLE_CATEGORIES } from "../../constants/muscles";

// Muscle filter categories organized by body zone

const getEquipmentIcon = (equipment: string) => {
    switch (equipment) {
        case 'cardio':
            return Activity;
        default:
            return Dumbbell;
    }
};

const ExercisePickerModalContent: React.FC<ExercisePickerModalProps> = ({
    visible,
    onSelect,
    onCustomExercise,
    onEditCustomExercise,
    onClose,
    recommendedExercises,
    customExercises = [],
    multiSelect = true,
}) => {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMuscle, setSelectedMuscle] = useState<BodyPartSlug | null>(null);
    const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());

    // Reset state when modal opens/closes
    React.useEffect(() => {
        if (visible) {
            setSelectedExercises(new Set());
            if (!recommendedExercises || recommendedExercises.length === 0) {
                setSelectedMuscle(null);
            }
        }
    }, [visible, recommendedExercises]);

    const handleMuscleSelect = (muscle: BodyPartSlug) => {
        setSelectedMuscle(prev => prev === muscle ? null : muscle);
    };

    // Filter exercises based on selected muscle
    const filteredByCategory = useMemo(() => {
        const fullCatalog = [...customExercises, ...EXERCISE_CATALOG];

        // If we have recommendations and no manual filters, show recommendations
        if (recommendedExercises && recommendedExercises.length > 0 && !selectedMuscle) {
            return recommendedExercises;
        }

        // If no muscle selected, show all
        if (!selectedMuscle) {
            return fullCatalog;
        }

        // Filter by selected muscle
        return fullCatalog.filter(ex =>
            ex.primaryMuscles.includes(selectedMuscle)
        );
    }, [selectedMuscle, recommendedExercises, customExercises]);

    // Further filter by search query
    const filteredExercises = useMemo(() => {
        const withTranslations = filteredByCategory.map(ex => ({
            ...ex,
            displayName: ex.id.startsWith('custom_') ? ex.nameKey : t(`exercises.${ex.id}`)
        }));

        if (!searchQuery) return withTranslations;

        const query = searchQuery.toLowerCase();
        return withTranslations.filter(ex =>
            ex.displayName.toLowerCase().includes(query)
        );
    }, [searchQuery, filteredByCategory, t]);

    const toggleSelection = (exercise: CatalogExercise, name: string) => {
        if (!multiSelect) {
            // Immediate selection for single mode
            onSelect([{ exercise, translatedName: name }]);
            return;
        }

        const newSet = new Set(selectedExercises);
        if (newSet.has(exercise.id)) {
            newSet.delete(exercise.id);
        } else {
            newSet.add(exercise.id);
        }
        setSelectedExercises(newSet);
    };

    const handleConfirmSelection = () => {
        const selectedList = [...customExercises, ...EXERCISE_CATALOG]
            .filter(ex => selectedExercises.has(ex.id))
            .map(ex => ({
                exercise: ex,
                translatedName: ex.id.startsWith('custom_') ? ex.nameKey : t(`exercises.${ex.id}`)
            }));

        onSelect(selectedList);
    };

    const renderItem = ({ item }: { item: CatalogExercise & { displayName: string } }) => {
        const Icon = getEquipmentIcon(item.equipment);
        const subtitle = `${t(`equipment.${item.equipment}`)} • ${t(`mechanic.${item.mechanic}`)}`;
        const isCustom = item.id.startsWith('custom_');
        const isSelected = selectedExercises.has(item.id);

        return (
            <TouchableOpacity
                style={[styles.exerciseCard, isSelected && styles.exerciseCardSelected]}
                onPress={() => toggleSelection(item, item.displayName)}
            >
                <View style={[styles.iconBox, isCustom && { backgroundColor: COLORS.primary + '20' }]}>
                    <Icon color={COLORS.primary} size={24} />
                </View>
                <View style={styles.exerciseInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.exerciseName, isSelected && { color: COLORS.primary }]}>{item.displayName}</Text>
                        {isCustom && (
                            <View style={styles.customBadge}>
                                <Text style={styles.customBadgeText}>Mío</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.exerciseSubtitle}>{subtitle}</Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    {isCustom && onEditCustomExercise && (
                        <TouchableOpacity
                            onPress={() => onEditCustomExercise(item)}
                            style={styles.actionButton}
                        >
                            <Pencil color={COLORS.textSecondary} size={20} />
                        </TouchableOpacity>
                    )}

                    {isSelected && multiSelect && (
                        <View style={styles.checkCircle}>
                            <Check color={COLORS.textInverse} size={14} strokeWidth={3} />
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>{t('exercise_picker.title')}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <X color={COLORS.textPrimary} size={24} />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
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

            {/* Muscle Filter Chips - Simple horizontal row */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsContainer}
                style={styles.chipsScroll}
            >
                {MUSCLE_CATEGORIES.flatMap(cat => cat.muscles).map((muscle) => {
                    const isSelected = selectedMuscle === muscle.slug;
                    return (
                        <TouchableOpacity
                            key={muscle.slug}
                            style={[
                                styles.chip,
                                isSelected && styles.chipSelected
                            ]}
                            onPress={() => handleMuscleSelect(muscle.slug)}
                        >
                            <Text style={[
                                styles.chipText,
                                isSelected && styles.chipTextSelected
                            ]}>
                                {muscle.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Results count */}
            <View style={styles.resultsBar}>
                <Text style={styles.resultsText}>
                    {filteredExercises.length} {filteredExercises.length === 1 ? 'ejercicio' : 'ejercicios'}
                </Text>
                {selectedMuscle && (
                    <TouchableOpacity onPress={() => setSelectedMuscle(null)}>
                        <Text style={styles.clearText}>Limpiar</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Exercise List */}
            <View style={{ flex: 1 }}>
                <TypedFlashList
                    data={filteredExercises}
                    renderItem={renderItem}
                    keyExtractor={(item: any) => item.id}
                    contentContainerStyle={styles.listContent}
                    estimatedItemSize={75}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>
                                {t('exercise_picker.no_results')}
                            </Text>
                        </View>
                    }
                />
            </View>

            {/* Bottom Actions */}
            <View style={[styles.customButtonContainer, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity
                    style={styles.customButton}
                    onPress={onCustomExercise}
                >
                    <Text style={styles.customButtonText}>
                        {t('exercise_picker.custom_exercise')}
                    </Text>
                </TouchableOpacity>

                {multiSelect && selectedExercises.size > 0 && (
                    <TouchableOpacity
                        style={styles.addSelectedButton}
                        onPress={handleConfirmSelection}
                    >
                        <Text style={styles.addSelectedButtonText}>
                            Añadir {selectedExercises.size} {selectedExercises.size === 1 ? 'ejercicio' : 'ejercicios'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export const ExercisePickerModal = (props: ExercisePickerModalProps) => {
    if (!props.visible) return null;
    return (
        <Modal
            visible={true}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={props.onClose}
        >
            <ExercisePickerModalContent {...props} />
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
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        marginHorizontal: 16,
        marginTop: 16,
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
    chipsScroll: {
        marginTop: 12,
        flexGrow: 0,
        flexShrink: 0, // No permitir que se comprima
        minHeight: 56,
    },
    chipsContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
        alignItems: 'center',
        minHeight: 56,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 12, // Más altura interna
        borderRadius: 24,    // Más redondeado
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    chipSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    chipText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textPrimary,
        lineHeight: 18,
    },
    chipTextSelected: {
        color: COLORS.textInverse,
    },
    resultsBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    resultsText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    clearText: {
        fontSize: 13,
        color: COLORS.primary,
        fontWeight: "600",
    },
    listContent: {
        paddingVertical: 8,
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
        width: 48,
        height: 48,
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
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.textPrimary,
        marginBottom: 2,
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
    addSelectedButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        marginTop: 12,
    },
    addSelectedButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.textInverse,
    },
    customButtonContainer: {
        padding: 16,
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
        paddingVertical: 14,
        alignItems: "center",
    },
    customButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.primary,
    },
    customBadge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    customBadgeText: {
        fontSize: 10,
        fontWeight: "700",
        color: COLORS.textInverse,
        textTransform: "uppercase",
    },
    exerciseCardSelected: {
        backgroundColor: COLORS.primary + '10', // Light highlight
    },
    actionButton: {
        padding: 8,
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
