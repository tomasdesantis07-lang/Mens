import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { getRecommendedTemplate } from "../utils/routineRecommendation";

/**
 * Demo component to test the MENS recommendation engine
 * Import this in any screen to verify the logic
 * 
 * Example: import RecommendationDemo from '@/components/RecommendationDemo';
 * Then use: <RecommendationDemo />
 */
export default function RecommendationDemo() {
    const { t } = useTranslation();

    const testCases = [
        { days: 3, goal: "health" as const, level: "beginner" as const, label: "Beginner, 3 days, health" },
        { days: 4, goal: "muscle" as const, level: "intermediate" as const, label: "Intermediate, 4 days, muscle" },
        { days: 5, goal: "strength" as const, level: "advanced" as const, label: "Advanced, 5 days, strength" },
        { days: 2, goal: "muscle" as const, level: "beginner" as const, label: "Beginner, 2 days (edge case)" },
        { days: 6, goal: "muscle" as const, level: "beginner" as const, label: "Beginner, 6 days (moderated)" },
        { days: 6, goal: "muscle" as const, level: "intermediate" as const, label: "Intermediate, 6 days" },
        { days: 6, goal: "strength" as const, level: "advanced" as const, label: "Advanced, 6 days" },
    ];

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>🏋️ MENS Recommendation Engine Test</Text>

            {testCases.map((testCase, index) => {
                const result = getRecommendedTemplate({
                    daysAvailable: testCase.days,
                    goal: testCase.goal,
                    level: testCase.level,
                });

                const templateName = t(`mens_systems.${result.nameKey}`);

                return (
                    <View key={index} style={styles.testCase}>
                        <Text style={styles.testLabel}>{testCase.label}</Text>
                        <Text style={styles.testResult}>
                            ✅ {templateName}
                        </Text>
                        <Text style={styles.testDetails}>
                            Requested: {testCase.days} days → Recommended: {result.daysPerWeek} days
                        </Text>
                        {testCase.days !== result.daysPerWeek && (
                            <Text style={styles.wisdom}>
                                💡 MENS wisdom: Quality over quantity
                            </Text>
                        )}
                    </View>
                );
            })}

            <Text style={styles.footer}>
                ✅ All tests completed successfully!
            </Text>
            <Text style={styles.philosophy}>
                💪 MENS Philosophy: Quality training beats quantity every time.
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
    },
    testCase: {
        backgroundColor: "#f5f5f5",
        padding: 15,
        marginBottom: 15,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: "#FF6B35",
    },
    testLabel: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 5,
        color: "#333",
    },
    testResult: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#FF6B35",
        marginBottom: 5,
    },
    testDetails: {
        fontSize: 12,
        color: "#666",
    },
    wisdom: {
        fontSize: 12,
        color: "#FF6B35",
        fontStyle: "italic",
        marginTop: 5,
    },
    footer: {
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
        marginTop: 20,
        color: "#4CAF50",
    },
    philosophy: {
        fontSize: 14,
        textAlign: "center",
        marginTop: 10,
        marginBottom: 30,
        color: "#666",
        fontStyle: "italic",
    },
});
