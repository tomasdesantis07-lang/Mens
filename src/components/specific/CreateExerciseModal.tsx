import { X } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EQUIPMENT_OPTIONS, MUSCLE_CATEGORIES } from "../../constants/muscles";
import { COLORS } from "../../theme/theme";
import { BodyPartSlug } from "../../types/bodyParts";
import { CatalogExercise, Equipment, Mechanic } from "../../types/exercise";
import { CustomInput } from "../common/CustomInput";
import { PrimaryButton } from "../common/PrimaryButton";

interface CreateExerciseModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (exercise: Omit<CatalogExercise, "id">) => void;
    loading?: boolean;
    initialData?: CatalogExercise;
}

export const CreateExerciseModal: React.FC<CreateExerciseModalProps> = ({
    visible,
    onClose,
    onSave,
    loading = false,
    initialData,
}) => {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    const [name, setName] = useState(initialData?.nameKey || "");
    const [primaryMuscle, setPrimaryMuscle] = useState<BodyPartSlug | null>(initialData?.primaryMuscles?.[0] || null);
    const [secondaryMuscle, setSecondaryMuscle] = useState<BodyPartSlug | null>(initialData?.secondaryMuscles?.[0] || null);
    const [equipment, setEquipment] = useState<Equipment | null>(initialData?.equipment || null);

    React.useEffect(() => {
        if (visible) {
            if (initialData) {
                setName(initialData.nameKey);
                setPrimaryMuscle(initialData.primaryMuscles[0]);
                setSecondaryMuscle(initialData.secondaryMuscles[0] || null);
                setEquipment(initialData.equipment);
            } else {
                // Reset form
                setName("");
                setPrimaryMuscle(null);
                setSecondaryMuscle(null);
                setEquipment(null);
            }
        }
    }, [visible, initialData]);

    // Auto-determine mechanic
    const mechanic: Mechanic = secondaryMuscle ? "compound" : "isolation";

    const handleSave = () => {
        if (!name.trim() || !primaryMuscle || !equipment) return;

        const exerciseData: Omit<CatalogExercise, "id"> = {
            nameKey: name, // We store the actual name here for custom exercises
            primaryMuscles: [primaryMuscle],
            secondaryMuscles: secondaryMuscle ? [secondaryMuscle] : [],
            equipment,
            mechanic,
            // default force type, optional or could be inferred/asked later
        };

        onSave(exerciseData);
    };

    const isFormValid = name.trim().length > 0 && primaryMuscle !== null && equipment !== null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 16 : 16 }]}>
                    <Text style={styles.title}>{initialData ? "Editar ejercicio" : t('create_exercise.title')}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X color={COLORS.textPrimary} size={24} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Name */}
                    <View style={styles.section}>
                        <Text style={styles.label}>{t('create_exercise.name_label')}</Text>
                        <CustomInput
                            placeholder={t('create_exercise.name_placeholder')}
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    {/* Primary Muscle */}
                    <View style={styles.section}>
                        <Text style={styles.label}>{t('create_exercise.primary_muscle_label')}</Text>
                        <Text style={styles.hint}>{t('create_exercise.primary_muscle_hint')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                            {MUSCLE_CATEGORIES.map((cat) => (
                                <View key={cat.label} style={styles.categoryGroup}>
                                    <Text style={styles.categoryLabel}>{cat.label}</Text>
                                    <View style={styles.chipRow}>
                                        {cat.muscles.map((m) => {
                                            const isSelected = primaryMuscle === m.slug;
                                            const isSecondary = secondaryMuscle === m.slug;
                                            return (
                                                <TouchableOpacity
                                                    key={m.slug}
                                                    style={[
                                                        styles.chip,
                                                        isSelected && styles.chipSelected,
                                                        isSecondary && styles.chipDisabled
                                                    ]}
                                                    onPress={() => !isSecondary && setPrimaryMuscle(m.slug)}
                                                    disabled={isSecondary}
                                                >
                                                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                                                        {m.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Secondary Muscle */}
                    <View style={styles.section}>
                        <Text style={styles.label}>{t('create_exercise.secondary_muscle_label')}</Text>
                        <Text style={styles.hint}>{t('create_exercise.secondary_muscle_hint')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                            {MUSCLE_CATEGORIES.map((cat) => (
                                <View key={cat.label} style={styles.categoryGroup}>
                                    <Text style={styles.categoryLabel}>{cat.label}</Text>
                                    <View style={styles.chipRow}>
                                        {cat.muscles.map((m) => {
                                            const isSelected = secondaryMuscle === m.slug;
                                            const isPrimary = primaryMuscle === m.slug;
                                            return (
                                                <TouchableOpacity
                                                    key={m.slug}
                                                    style={[
                                                        styles.chip,
                                                        isSelected && styles.chipSelectedSecondary,
                                                        isPrimary && styles.chipDisabled
                                                    ]}
                                                    onPress={() => {
                                                        if (!isPrimary) {
                                                            setSecondaryMuscle(prev => prev === m.slug ? null : m.slug);
                                                        }
                                                    }}
                                                    disabled={isPrimary}
                                                >
                                                    <Text style={[
                                                        styles.chipText,
                                                        isSelected && styles.chipTextSelectedSecondary
                                                    ]}>
                                                        {m.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Equipment */}
                    <View style={styles.section}>
                        <Text style={styles.label}>{t('create_exercise.equipment_label')}</Text>
                        <View style={styles.grid}>
                            {EQUIPMENT_OPTIONS.map((eq) => {
                                const isSelected = equipment === eq.value;
                                return (
                                    <TouchableOpacity
                                        key={eq.value}
                                        style={[styles.gridItem, isSelected && styles.gridItemSelected]}
                                        onPress={() => setEquipment(eq.value as Equipment)}
                                    >
                                        <Text style={[styles.gridItemText, isSelected && styles.gridItemTextSelected]}>
                                            {eq.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Type Preview */}
                    <View style={styles.previewContainer}>
                        <Text style={styles.previewLabel}>Tipo de ejercicio:</Text>
                        <View style={[
                            styles.badge,
                            mechanic === 'compound' ? styles.badgeCompound : styles.badgeIsolation
                        ]}>
                            <Text style={styles.badgeText}>
                                {mechanic === 'compound'
                                    ? t('create_exercise.type_compound')
                                    : t('create_exercise.type_isolation')}
                            </Text>
                        </View>
                    </View>

                </ScrollView>

                <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                    <PrimaryButton
                        title={t('common.save')}
                        onPress={handleSave}
                        disabled={!isFormValid}
                        loading={loading}
                        style={{ width: '100%' }}
                    />
                </View>
            </KeyboardAvoidingView>
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
        paddingBottom: 16,
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
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: 24,
        paddingHorizontal: 20,
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    hint: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: 12,
    },
    horizontalScroll: {
        marginLeft: -20,
        marginRight: -20,
        paddingHorizontal: 20,
    },
    categoryGroup: {
        marginRight: 24,
    },
    categoryLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.textTertiary,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    chipRow: {
        flexDirection: 'column', // Stack chips so they don't stretch too wide
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignSelf: 'flex-start',
    },
    chipSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    chipSelectedSecondary: {
        backgroundColor: COLORS.secondary,
        borderColor: COLORS.secondary,
    },
    chipDisabled: {
        opacity: 0.5,
        backgroundColor: COLORS.background,
    },
    chipText: {
        fontSize: 14,
        color: COLORS.textPrimary,
        fontWeight: '500',
    },
    chipTextSelected: {
        color: COLORS.textInverse,
    },
    chipTextSelectedSecondary: {
        color: COLORS.textInverse,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    gridItem: {
        width: '48%', // Approx 2 columns
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
    },
    gridItemSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '10', // 10% opacity primary
    },
    gridItemText: {
        fontSize: 14,
        color: COLORS.textPrimary,
        fontWeight: '500',
    },
    gridItemTextSelected: {
        color: COLORS.primary,
        fontWeight: '700',
    },
    previewContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    previewLabel: {
        fontSize: 15,
        color: COLORS.textSecondary,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    badgeCompound: {
        backgroundColor: COLORS.warning + '20',
    },
    badgeIsolation: {
        backgroundColor: COLORS.accent + '20',
    },
    badgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.background,
    },
});
