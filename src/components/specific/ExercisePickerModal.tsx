import { Activity, Dumbbell, PlusCircle, Search, X } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    FlatList,
    Modal,
    Platform,
    ScrollView,
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

interface ExercisePickerModalProps {
    visible: boolean;
    onSelect: (exercise: CatalogExercise, translatedName: string) => void;
    onCustomExercise: () => void;
    onClose: () => void;
    recommendedExercises?: CatalogExercise[];
}

// Muscle filter categories organized by body zone
const MUSCLE_CATEGORIES: { label: string; muscles: { slug: BodyPartSlug; label: string }[] }[] = [
    {
        label: "Tren Superior",
        muscles: [
            { slug: "chest", label: "Pecho" },
            { slug: "deltoids", label: "Hombros" },
            { slug: "triceps", label: "Tríceps" },
            { slug: "biceps", label: "Bíceps" },
            { slug: "forearm", label: "Antebrazos" },
        ],
    },
    {
        label: "Espalda",
        muscles: [
            { slug: "lats", label: "Dorsales" },
            { slug: "upper-back", label: "Espalda Alta" },
            { slug: "trapezius", label: "Trapecios" },
            { slug: "lower-back", label: "Lumbar" },
        ],
    },
    {
        label: "Core",
        muscles: [
            { slug: "abs", label: "Abdominales" },
            { slug: "obliques", label: "Oblicuos" },
        ],
    },
    {
        label: "Tren Inferior",
        muscles: [
            { slug: "quadriceps", label: "Cuádriceps" },
            { slug: "hamstring", label: "Isquios" },
            { slug: "gluteal", label: "Glúteos" },
            { slug: "calves", label: "Pantorrillas" },
            { slug: "adductors", label: "Aductores" },
        ],
    },
];

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
    const [selectedMuscle, setSelectedMuscle] = useState<BodyPartSlug | null>(null);

    // Reset state when modal opens/closes
    React.useEffect(() => {
        if (visible) {
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
        // If we have recommendations and no manual filters, show recommendations
        if (recommendedExercises && recommendedExercises.length > 0 && !selectedMuscle) {
            return recommendedExercises;
        }

        // If no muscle selected, show all
        if (!selectedMuscle) {
            return EXERCISE_CATALOG;
        }

        // Filter by selected muscle
        return EXERCISE_CATALOG.filter(ex =>
            ex.primaryMuscles.includes(selectedMuscle)
        );
    }, [selectedMuscle, recommendedExercises]);

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
                <View style={styles.iconBox}>
                    <Icon color={COLORS.primary} size={24} />
                </View>
                <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{item.displayName}</Text>
                    <Text style={styles.exerciseSubtitle}>{subtitle}</Text>
                </View>
                <PlusCircle color={COLORS.primary} size={24} />
            </TouchableOpacity>
        );
    };

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
                    {[
                        { slug: "chest" as BodyPartSlug, label: "Pecho" },
                        { slug: "deltoids" as BodyPartSlug, label: "Hombros" },
                        { slug: "triceps" as BodyPartSlug, label: "Tríceps" },
                        { slug: "biceps" as BodyPartSlug, label: "Bíceps" },
                        { slug: "lats" as BodyPartSlug, label: "Dorsales" },
                        { slug: "upper-back" as BodyPartSlug, label: "Espalda Media" },
                        { slug: "trapezius" as BodyPartSlug, label: "Trapecios" },
                        { slug: "abs" as BodyPartSlug, label: "Abdomen" },
                        { slug: "quadriceps" as BodyPartSlug, label: "Cuádriceps" },
                        { slug: "hamstring" as BodyPartSlug, label: "Isquios" },
                        { slug: "gluteal" as BodyPartSlug, label: "Glúteos" },
                        { slug: "calves" as BodyPartSlug, label: "Pantorrillas" },
                    ].map((muscle) => {
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
                <View style={[styles.customButtonContainer, { paddingBottom: insets.bottom + 16 }]}>
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
});
