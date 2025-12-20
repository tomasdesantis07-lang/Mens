import { useRouter } from "expo-router";
import { Edit3, Sparkles } from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AIRoutineRequest, AIService } from "../../src/services/aiService";
import { COLORS, TYPOGRAPHY } from "../../src/theme/theme";

// ============================================================================
// DEV MODE CONFIGURATION
// ============================================================================
const DEV_TAP_THRESHOLD = 5;      // Number of rapid taps to activate
const DEV_TAP_TIMEOUT_MS = 2000;  // Time window for taps

const CreateRoutineScreen: React.FC = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    // ========================================================================
    // DEV MODE - Secret Hook for AI Testing
    // Tap title 5 times rapidly to trigger AI generation test
    // ========================================================================
    const [devTapCount, setDevTapCount] = useState(0);
    const [isDevLoading, setIsDevLoading] = useState(false);
    const devTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleTitleTap = useCallback(async () => {
        // Clear existing timer
        if (devTapTimerRef.current) {
            clearTimeout(devTapTimerRef.current);
        }

        const newCount = devTapCount + 1;
        setDevTapCount(newCount);

        // Set timer to reset tap count
        devTapTimerRef.current = setTimeout(() => {
            setDevTapCount(0);
        }, DEV_TAP_TIMEOUT_MS);

        // Check if threshold reached
        if (newCount >= DEV_TAP_THRESHOLD) {
            setDevTapCount(0);
            if (devTapTimerRef.current) {
                clearTimeout(devTapTimerRef.current);
            }

            // Execute AI test
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("🤖 [DEV MODE] MENS AI Test Triggered");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

            setIsDevLoading(true);

            try {
                // Test connection first
                console.log("\n📡 Testing Gemini connection...");
                const connectionTest = await AIService.testConnection();
                console.log("Connection result:", connectionTest);

                if (!connectionTest.success) {
                    console.error("❌ Connection failed:", connectionTest.message);
                    setIsDevLoading(false);
                    return;
                }

                console.log("✅ Connection OK in", connectionTest.latencyMs, "ms");

                // Generate test routine
                console.log("\n🏋️ Generating test routine...");
                const testRequest: AIRoutineRequest = {
                    goal: "hypertrophy",
                    daysPerWeek: 4,
                    level: "intermediate",
                    equipment: "full_gym",
                    focusMuscles: ["pecho", "espalda"],
                };

                const result = await AIService.generateRoutine(testRequest);

                console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                console.log("📋 GENERATION RESULT:");
                console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                console.log("Success:", result.success);
                console.log("Latency:", result.latencyMs, "ms");

                if (result.success && result.draft) {
                    console.log("\n✅ Generated Routine:", result.draft.name);
                    console.log("Days with exercises:", result.draft.days.filter(d => d.exercises.length > 0).length);

                    result.draft.days.forEach((day) => {
                        if (day.exercises.length > 0) {
                            console.log(`\n📅 ${day.label}:`);
                            day.exercises.forEach((ex) => {
                                console.log(`   - ${ex.name}: ${ex.sets.length}x${ex.reps} (${ex.restSeconds}s rest)`);
                            });
                        }
                    });

                    console.log("\n📦 Full Draft Object:");
                    console.log(JSON.stringify(result.draft, null, 2));
                } else {
                    console.error("❌ Generation failed:", result.error);
                    if (result.rawResponse) {
                        console.log("\n📝 Raw Response:");
                        console.log(result.rawResponse);
                    }
                }

                console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

            } catch (error) {
                console.error("❌ [DEV MODE] Error:", error);
            }

            setIsDevLoading(false);
        }
    }, [devTapCount]);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 120 }}
        >
            {/* Title - Tappable for dev mode */}
            <TouchableOpacity
                onPress={handleTitleTap}
                activeOpacity={1}
                disabled={isDevLoading}
            >
                <Text style={styles.title}>
                    {isDevLoading ? "🤖 Generating..." : t('routines.create_title')}
                </Text>
            </TouchableOpacity>

            <Text style={styles.subtitle}>
                {t('routines.create_subtitle')}
            </Text>

            {/* Dev mode indicator (subtle) */}
            {devTapCount > 0 && devTapCount < DEV_TAP_THRESHOLD && (
                <View style={styles.devIndicator}>
                    <Text style={styles.devIndicatorText}>
                        🔧 {devTapCount}/{DEV_TAP_THRESHOLD}
                    </Text>
                </View>
            )}

            <View style={styles.optionsContainer}>
                {/* Manual Creation - Enabled */}
                <TouchableOpacity
                    style={styles.optionCard}
                    onPress={() => router.push("../routines/manual-editor" as any)}
                >
                    <View style={styles.iconContainer}>
                        <Edit3 color={COLORS.primary} size={32} />
                    </View>
                    <Text style={styles.optionTitle}>{t('routines.create_manual')}</Text>
                    <Text style={styles.optionDescription}>
                        {t('routines.create_manual_desc')}
                    </Text>
                </TouchableOpacity>

                {/* AI Creation - Disabled (Coming Soon) */}
                <TouchableOpacity
                    style={[styles.optionCard, styles.optionCardDisabled]}
                    disabled
                >
                    <View style={styles.iconContainer}>
                        <Sparkles color={COLORS.textSecondary} size={32} />
                    </View>
                    <Text style={[styles.optionTitle, styles.textDisabled]}>
                        {t('routines.create_ai')}
                    </Text>
                    <Text style={[styles.optionDescription, styles.textDisabled]}>
                        {t('routines.create_ai_desc')}
                    </Text>
                    <View style={styles.comingSoonBadge}>
                        <Text style={styles.comingSoonText}>{t('common.coming_soon')}</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
            >
                <Text style={styles.backButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

export default CreateRoutineScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    title: {
        ...TYPOGRAPHY.h1,
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    subtitle: {
        ...TYPOGRAPHY.bodyLarge,
        color: COLORS.textSecondary,
        marginBottom: 32,
    },
    optionsContainer: {
        gap: 16,
    },
    optionCard: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 24,
        position: "relative",
    },
    optionCardDisabled: {
        opacity: 0.6,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: COLORS.surface,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    optionTitle: {
        ...TYPOGRAPHY.h3,
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    optionDescription: {
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
    },
    textDisabled: {
        color: COLORS.textTertiary,
    },
    comingSoonBadge: {
        position: "absolute",
        top: 16,
        right: 16,
        backgroundColor: COLORS.warning,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    comingSoonText: {
        ...TYPOGRAPHY.label,
        fontSize: 11,
        color: COLORS.background,
    },
    backButton: {
        marginTop: 24,
        alignItems: "center",
        paddingVertical: 12,
    },
    backButtonText: {
        ...TYPOGRAPHY.button,
        color: COLORS.textSecondary,
    },
    // Dev mode indicator
    devIndicator: {
        position: "absolute",
        top: 60,
        right: 24,
        backgroundColor: COLORS.warning + "20",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    devIndicatorText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.warning,
    },
});
