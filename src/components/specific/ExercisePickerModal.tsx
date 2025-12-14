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
}

type FilterOption =
    | 'all'
    | 'chest'
    | 'back'
    | 'legs'
    | 'shoulders'
    | 'arms'
    | 'abs'
    | 'cardio';

const FILTER_KEYS: { key: FilterOption; muscles: BodyPartSlug[] }[] = [
    { key: 'all', muscles: [] },
    { key: 'chest', muscles: ['chest'] },
    { key: 'back', muscles: ['upper-back', 'lower-back', 'lats', 'trapezius'] },
    { key: 'legs', muscles: ['quadriceps', 'hamstring', 'gluteal', 'calves', 'adductors'] },
    { key: 'shoulders', muscles: ['deltoids'] },
    { key: 'arms', muscles: ['biceps', 'triceps', 'forearm'] },
    { key: 'abs', muscles: ['abs', 'obliques'] },
    { key: 'cardio', muscles: [] },
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
}) => {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFilter, setSelectedFilter] = useState<FilterOption>('all');

    // Memoize translated filters
    const filters = useMemo(() => {
        return FILTER_KEYS.map(f => ({
            ...f,
            label: t(`body_parts.${f.key}`)
        }));
    }, [t]);

    // Filter based on selected category
    const filteredByCategory = useMemo(() => {
        if (selectedFilter === 'all') return EXERCISE_CATALOG;

        if (selectedFilter === 'cardio') {
            return EXERCISE_CATALOG.filter(ex => ex.equipment === 'cardio');
        }

        const filterConfig = FILTER_KEYS.find(f => f.key === selectedFilter);
        if (!filterConfig) return EXERCISE_CATALOG;

        return EXERCISE_CATALOG.filter(ex =>
            ex.primaryMuscles.some(muscle => filterConfig.muscles.includes(muscle))
        );
    }, [selectedFilter]);

    // Further filter by search query
    // Also attach translated name for searching
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

    const renderFilterChip = (filter: typeof filters[0]) => {
        const isSelected = selectedFilter === filter.key;
        return (
            <TouchableOpacity
                key={filter.key}
                style={[
                    styles.filterChip,
                    isSelected && styles.filterChipActive
                ]}
                onPress={() => setSelectedFilter(filter.key)}
            >
                <Text style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive
                ]}>
                    {filter.label}
                </Text>
            </TouchableOpacity>
        );
    };

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

                {/* Filter Chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScrollContent}
                    style={styles.filterScroll}
                >
                    {filters.map(renderFilterChip)}
                </ScrollView>

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
    filterScroll: {
        marginTop: 16,
        maxHeight: 44,
    },
    filterScrollContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    filterChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textSecondary,
    },
    filterChipTextActive: {
        color: '#000000',
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
