import { useRouter } from "expo-router";
import { Check, Edit as EditIcon, Home, Trash2 } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { FadeInDown, FadeOutDown, runOnJS } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConfirmDialog } from "../src/components/common/ConfirmDialog";
import { auth } from "../src/services/firebaseConfig";
import { WorkoutService } from "../src/services/workoutService";
import { COLORS, FONT_FAMILY } from "../src/theme/theme";
import { WorkoutSession } from "../src/types/workout";

const PAGE_SIZE = 10;

const WorkoutHistoryScreen: React.FC = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // Selection State
    const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
    const isSelectionMode = selectedSessions.size > 0;
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Drag Selection State
    const [isScrollEnabled, setIsScrollEnabled] = useState(true);
    const listOffsetRef = useRef(0);
    const flatListRef = useRef<FlatList>(null);
    const listLayoutYRef = useRef(0);

    useEffect(() => {
        loadInitial();
    }, []);

    const loadInitial = async () => {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            const data = await WorkoutService.getRecentSessions(userId, PAGE_SIZE);
            setSessions(data);
            setHasMore(data.length === PAGE_SIZE);
        } catch (error) {
            console.error("Error loading workout history:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = async () => {
        if (loadingMore || !hasMore) return;

        const userId = auth.currentUser?.uid;
        if (!userId || sessions.length === 0) return;

        setLoadingMore(true);

        try {
            const allSessions = await WorkoutService.getAllUserWorkoutSessions(userId);
            const nextBatch = allSessions.slice(sessions.length, sessions.length + PAGE_SIZE);

            if (nextBatch.length > 0) {
                setSessions(prev => [...prev, ...nextBatch]);
                setHasMore(nextBatch.length === PAGE_SIZE);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error loading more sessions:", error);
        } finally {
            setLoadingMore(false);
        }
    };

    const handleLongPress = (id: string) => {
        const next = new Set(selectedSessions);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedSessions(next);
    };

    const handlePress = (id: string) => {
        if (isSelectionMode) {
            handleLongPress(id);
        } else {
            console.log("View workout:", id);
        }
    };

    const handleDelete = async () => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        try {
            const idsToDelete = Array.from(selectedSessions);
            await WorkoutService.deleteWorkoutSessions(userId, idsToDelete);

            setSessions(prev => prev.filter(s => !selectedSessions.has(s.id)));
            setSelectedSessions(new Set());
            setShowDeleteConfirm(false);
        } catch (error) {
            console.error("Error deleting sessions:", error);
        }
    };

    const handleEdit = () => {
        if (selectedSessions.size !== 1) return;
        const sessionId = Array.from(selectedSessions)[0];
        console.log("Edit session:", sessionId);
    };

    // --- Drag Selection Logic ---

    const disableScroll = () => {
        setIsScrollEnabled(false);
    };

    const enableScroll = () => {
        setIsScrollEnabled(true);
    };

    const updateSelectionFromGesture = (y: number) => {
        // Adjust y for actual list position
        const relativeY = y - listLayoutYRef.current;

        // Dynamic estimate based on list offset
        const ITEM_HEIGHT_ESTIMATE = 145;
        const index = Math.floor((relativeY + listOffsetRef.current) / ITEM_HEIGHT_ESTIMATE);

        if (index >= 0 && index < sessions.length) {
            const item = sessions[index];
            if (item) {
                setSelectedSessions(prev => {
                    // Only add, don't toggle during drag for predictable behavior
                    if (!prev.has(item.id)) {
                        const next = new Set(prev);
                        next.add(item.id);
                        return next;
                    }
                    return prev;
                });
            }
        }

        // Auto-scroll logic could be added here if cursor near edges
    };

    // Pan Gesture
    const panGesture = Gesture.Pan()
        .activateAfterLongPress(300) // This prevents conflict with normal scroll? No, we want instant drag if already selected
        // Better: Manual activation logic.
        .onStart(() => {
            if (isSelectionMode) {
                runOnJS(disableScroll)();
            }
        })
        .onUpdate((e) => {
            if (isSelectionMode) {
                runOnJS(updateSelectionFromGesture)(e.absoluteY);
            }
        })
        .onEnd(() => {
            runOnJS(enableScroll)();
        })
        .onFinalize(() => {
            runOnJS(enableScroll)();
        });


    // Track scroll offset
    const handleScroll = (event: any) => {
        listOffsetRef.current = event.nativeEvent.contentOffset.y;
    };

    // --- Render Helpers ---

    const formatDate = (timestamp: any): string => {
        if (!timestamp?.toDate) return "";
        const date = timestamp.toDate();
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return t("recent_workouts.today");
        if (diffDays === 1) return t("recent_workouts.yesterday");
        if (diffDays < 7) return `${diffDays} ${t("recent_workouts.days_ago")}`;

        return date.toLocaleDateString("es-AR", {
            day: "numeric",
            month: "short",
            year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
        });
    };

    const formatDuration = (minutes: number): string => {
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hrs > 0) return `${hrs}h ${mins}m`;
        return `${mins}m`;
    };

    const getDurationMinutes = (session: WorkoutSession): number => {
        if (session.durationSeconds && session.durationSeconds > 0) {
            return Math.round(session.durationSeconds / 60);
        }
        let totalSets = 0;
        for (const exercise of session.exercises) {
            totalSets += exercise.sets.length;
        }
        return Math.max(15, totalSets * 2);
    };

    const calculateVolume = (session: WorkoutSession): number => {
        let total = 0;
        for (const exercise of session.exercises) {
            for (const set of exercise.sets) {
                total += set.weight * set.reps;
            }
        }
        return total;
    };

    const renderSession = ({ item, index }: { item: WorkoutSession; index: number }) => {
        const isSelected = selectedSessions.has(item.id);

        return (
            <TouchableOpacity
                style={[
                    styles.sessionCard,
                    isSelected && styles.sessionCardSelected,
                    isSelectionMode && !isSelected && styles.sessionCardDimmed
                ]}
                onLongPress={() => handleLongPress(item.id)}
                onPress={() => handlePress(item.id)}
                activeOpacity={0.7}
                delayLongPress={200}
            >
                {isSelected && (
                    <View style={styles.selectionIndicator}>
                        <Check size={16} color={COLORS.surface} strokeWidth={3} />
                    </View>
                )}

                <View style={styles.sessionHeader}>
                    <Text style={styles.sessionName} numberOfLines={1}>
                        {item.routineName || "Entrenamiento"}
                    </Text>
                    <Text style={styles.sessionDate}>{formatDate(item.performedAt)}</Text>
                </View>

                <View style={styles.sessionStats}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{item.exercises.length}</Text>
                        <Text style={styles.statLabel}>{t('common.exercises')}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{formatDuration(getDurationMinutes(item))}</Text>
                        <Text style={styles.statLabel}>{t('common.duration')}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                            {(calculateVolume(item) / 1000).toFixed(1)}k
                        </Text>
                        <Text style={styles.statLabel}>kg</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderFooter = () => {
        if (!hasMore) {
            return (
                <View style={styles.endMessage}>
                    <Text style={styles.endMessageText}>
                        {sessions.length === 0 ? t("recent_workouts.empty") : "— Fin del historial —"}
                    </Text>
                </View>
            );
        }

        return (
            <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={loadMore}
                disabled={loadingMore}
            >
                {loadingMore ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                    <Text style={styles.loadMoreText}>Cargar más</Text>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>
                {/* Sticky Header */}
                <View style={[styles.header, { paddingTop: insets.top }]}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => {
                            if (isSelectionMode) {
                                setSelectedSessions(new Set());
                                setIsScrollEnabled(true);
                            } else {
                                router.back();
                            }
                        }}
                    >
                        {isSelectionMode ? (
                            <Text style={styles.cancelText}>Cancelar</Text>
                        ) : (
                            <Home size={22} color={COLORS.textPrimary} />
                        )}
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {isSelectionMode
                            ? `${selectedSessions.size} seleccionados`
                            : t("recent_workouts.title")}
                    </Text>
                    <View style={styles.headerSpacer} />
                </View>

                {/* Content */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : (
                    <GestureDetector gesture={panGesture}>
                        <View
                            style={{ flex: 1 }}
                            onLayout={(e) => {
                                // Capture container Y position
                                // in measureInWindow or relative
                                // Simple relative offset if header is fixed height
                                // But header helps us know offset.
                                // We'll rely on insets + hardcoded header height if needed
                                // Or use absoluteY - headerHeight in logic
                                listLayoutYRef.current = 60 + insets.top;
                            }}
                        >
                            <FlatList
                                ref={flatListRef}
                                data={sessions}
                                renderItem={renderSession}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
                                ListFooterComponent={renderFooter}
                                showsVerticalScrollIndicator={false}
                                onScroll={handleScroll}
                                scrollEventThrottle={16}
                                scrollEnabled={isScrollEnabled}
                            />
                        </View>
                    </GestureDetector>
                )}

                {/* Action Bar */}
                {isSelectionMode && (
                    <Animated.View
                        entering={FadeInDown.duration(200)}
                        exiting={FadeOutDown.duration(200)}
                        style={[styles.actionBar, { paddingBottom: insets.bottom + 12 }]}
                    >
                        {selectedSessions.size === 1 && (
                            <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
                                <EditIcon size={24} color={COLORS.textPrimary} />
                                <Text style={styles.actionLabel}>Editar</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.actionButton, styles.deleteButton]}
                            onPress={() => setShowDeleteConfirm(true)}
                        >
                            <Trash2 size={24} color={COLORS.error} />
                            <Text style={[styles.actionLabel, { color: COLORS.error }]}>Eliminar</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                <ConfirmDialog
                    visible={showDeleteConfirm}
                    title="¿Eliminar entrenamientos?"
                    message={`Se eliminarán ${selectedSessions.size} entrenamientos y no podrán recuperarse.`}
                    confirmText="Eliminar"
                    cancelText="Cancelar"
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                    variant="danger"
                />
            </View>
        </GestureHandlerRootView>
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
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: COLORS.background,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        zIndex: 10,
    },
    backButton: {
        minWidth: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.card,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 10,
    },
    cancelText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.primary,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontFamily: FONT_FAMILY.bold,
        color: COLORS.textPrimary,
        textAlign: "center",
        marginHorizontal: 12,
    },
    headerSpacer: {
        width: 44,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    listContent: {
        padding: 16,
    },
    sessionCard: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
        marginBottom: 12,
        position: 'relative',
        overflow: 'hidden',
    },
    sessionCardSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '10', // 10% opacity primary
    },
    sessionCardDimmed: {
        opacity: 0.5,
    },
    selectionIndicator: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    sessionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    sessionName: {
        flex: 1,
        fontSize: 16,
        fontFamily: FONT_FAMILY.bold,
        color: COLORS.textPrimary,
        marginRight: 12,
    },
    sessionDate: {
        fontSize: 13,
        fontFamily: FONT_FAMILY.regular,
        color: COLORS.textSecondary,
    },
    sessionStats: {
        flexDirection: "row",
        alignItems: "center",
    },
    statItem: {
        flex: 1,
        alignItems: "center",
    },
    statValue: {
        fontSize: 18,
        fontFamily: FONT_FAMILY.bold,
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 11,
        fontFamily: FONT_FAMILY.regular,
        color: COLORS.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    statDivider: {
        width: 1,
        height: 32,
        backgroundColor: COLORS.border,
        marginHorizontal: 8,
    },
    loadMoreButton: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.primary,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 8,
    },
    loadMoreText: {
        fontSize: 14,
        fontFamily: FONT_FAMILY.bold,
        color: COLORS.primary,
    },
    endMessage: {
        paddingVertical: 24,
        alignItems: "center",
    },
    endMessageText: {
        fontSize: 13,
        fontFamily: FONT_FAMILY.regular,
        color: COLORS.textTertiary,
    },
    actionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.card,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        paddingHorizontal: 24,
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    actionButton: {
        alignItems: 'center',
        gap: 4,
        minWidth: 80,
    },
    deleteButton: {
        // opacity: 0.9,
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
});

export default WorkoutHistoryScreen;
