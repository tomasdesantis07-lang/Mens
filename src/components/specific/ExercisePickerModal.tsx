import { Search, X } from "lucide-react-native";
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
import { CatalogExercise } from "../../types/exercise";

interface ExercisePickerModalProps {
    visible: boolean;
    onSelect: (exercise: CatalogExercise, translatedName: string) => void;
    onCustomExercise: () => void;
    onClose: () => void;
}

export const ExercisePickerModal: React.FC<ExercisePickerModalProps> = ({
    visible,
    onSelect,
    onCustomExercise,
    onClose,
}) => {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState("");

    // Memoize translated catalog for performance
    const translatedCatalog = useMemo(() => {
        return EXERCISE_CATALOG.map((ex) => ({
            ...ex,
            displayName: t(`exercises.${ex.id}`),
            zoneName: t(`body_zones.${ex.targetZone}`),
        }));
    }, [t]);

    // Filter based on search query
    const filteredExercises = useMemo(() => {
        if (!searchQuery) return translatedCatalog;

        const query = searchQuery.toLowerCase();
        return translatedCatalog.filter(
            (ex) =>
                ex.displayName.toLowerCase().includes(query) ||
                ex.zoneName.toLowerCase().includes(query)
        );
    }, [searchQuery, translatedCatalog]);

    const renderItem = ({ item }: { item: typeof translatedCatalog[0] }) => (
        <TouchableOpacity
            style={styles.item}
            onPress={() => onSelect(item, item.displayName)}
        >
            <View>
                <Text style={styles.itemName}>{item.displayName}</Text>
                <Text style={styles.itemZone}>{item.zoneName}</Text>
            </View>
        </TouchableOpacity>
    );

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
                        autoFocus
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery("")}>
                            <X color={COLORS.textSecondary} size={16} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* List */}
                <FlatList
                    data={filteredExercises}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>{t('exercise_picker.no_results')}</Text>
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
        fontSize: 18,
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
        margin: 16,
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
    listContent: {
        paddingBottom: 40,
    },
    item: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    itemName: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    itemZone: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 0.5,
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
