import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../theme/theme";
import { PrimaryButton } from "../common/PrimaryButton";

interface RestTimePickerProps {
    visible: boolean;
    initialSeconds: number;
    onConfirm: (seconds: number) => void;
    onCancel: () => void;
}

const MINUTES = Array.from({ length: 11 }, (_, i) => i); // 0-10
const SECONDS = [0, 15, 30, 45];

export const RestTimePicker: React.FC<RestTimePickerProps> = ({
    visible,
    initialSeconds,
    onConfirm,
    onCancel,
}) => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    const initialMinutes = Math.floor(initialSeconds / 60);
    const initialSecs = initialSeconds % 60;
    const closestSecond = SECONDS.reduce((prev, curr) =>
        Math.abs(curr - initialSecs) < Math.abs(prev - initialSecs) ? curr : prev
    );

    const [selectedMinutes, setSelectedMinutes] = useState(initialMinutes);
    const [selectedSeconds, setSelectedSeconds] = useState(closestSecond);

    const handleConfirm = () => {
        const totalSeconds = selectedMinutes * 60 + selectedSeconds;
        onConfirm(totalSeconds);
    };

    const formatTime = (min: number, sec: number) => {
        return `${min}:${sec.toString().padStart(2, "0")}`;
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onCancel} />
                <View style={[styles.picker, { paddingBottom: insets.bottom + 20 }]}>
                    <Text style={styles.title}>{t('rest_time_picker.title')}</Text>

                    <View style={styles.timeDisplay}>
                        <Text style={styles.timeText}>{formatTime(selectedMinutes, selectedSeconds)}</Text>
                    </View>

                    <View style={styles.selectorsContainer}>
                        {/* Minutes */}
                        <View style={styles.selectorColumn}>
                            <Text style={styles.selectorLabel}>{t('rest_time_picker.minutes')}</Text>
                            <ScrollView style={styles.scrollPicker} showsVerticalScrollIndicator={false}>
                                {MINUTES.map((min) => (
                                    <TouchableOpacity
                                        key={min}
                                        style={[
                                            styles.pickerItem,
                                            selectedMinutes === min && styles.pickerItemSelected,
                                        ]}
                                        onPress={() => setSelectedMinutes(min)}
                                    >
                                        <Text
                                            style={[
                                                styles.pickerItemText,
                                                selectedMinutes === min && styles.pickerItemTextSelected,
                                            ]}
                                        >
                                            {min}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Seconds */}
                        <View style={styles.selectorColumn}>
                            <Text style={styles.selectorLabel}>{t('rest_time_picker.seconds')}</Text>
                            <View style={styles.secondsGrid}>
                                {SECONDS.map((sec) => (
                                    <TouchableOpacity
                                        key={sec}
                                        style={[
                                            styles.secondButton,
                                            selectedSeconds === sec && styles.secondButtonSelected,
                                        ]}
                                        onPress={() => setSelectedSeconds(sec)}
                                    >
                                        <Text
                                            style={[
                                                styles.secondButtonText,
                                                selectedSeconds === sec && styles.secondButtonTextSelected,
                                            ]}
                                        >
                                            {sec.toString().padStart(2, "0")}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                    <View style={styles.buttons}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                            <Text style={styles.cancelButtonText}>{t('rest_time_picker.cancel')}</Text>
                        </TouchableOpacity>
                        <PrimaryButton
                            title={t('rest_time_picker.confirm')}
                            onPress={handleConfirm}
                            style={styles.confirmButton}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        alignItems: "center",
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    picker: {
        backgroundColor: COLORS.card,
        borderRadius: 24,
        padding: 24,
        width: "85%",
        maxWidth: 400,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: COLORS.textPrimary,
        textAlign: "center",
        marginBottom: 20,
    },
    timeDisplay: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        alignItems: "center",
    },
    timeText: {
        fontSize: 48,
        fontWeight: "700",
        color: COLORS.primary,
        fontVariant: ["tabular-nums"],
    },
    selectorsContainer: {
        flexDirection: "row",
        gap: 16,
        marginBottom: 24,
    },
    selectorColumn: {
        flex: 1,
    },
    selectorLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.textSecondary,
        textAlign: "center",
        marginBottom: 8,
        textTransform: "uppercase",
    },
    scrollPicker: {
        maxHeight: 200,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
    },
    pickerItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: "center",
    },
    pickerItemSelected: {
        backgroundColor: COLORS.primary,
    },
    pickerItemText: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.textSecondary,
    },
    pickerItemTextSelected: {
        color: COLORS.textInverse,
    },
    secondsGrid: {
        gap: 8,
    },
    secondButton: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        borderWidth: 2,
        borderColor: COLORS.border,
    },
    secondButtonSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    secondButtonText: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.textSecondary,
    },
    secondButtonTextSelected: {
        color: COLORS.textInverse,
    },
    buttons: {
        flexDirection: "row",
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        backgroundColor: COLORS.surface,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textSecondary,
    },
    confirmButton: {
        flex: 1,
    },
});
