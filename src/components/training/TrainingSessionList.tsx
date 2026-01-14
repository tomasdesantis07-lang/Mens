import { FlashList } from "@shopify/flash-list";
import { Plus, Trash2 } from "lucide-react-native";
import React, { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    Animated as RNAnimated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from "react-native-draggable-flatlist";
import { Swipeable } from "react-native-gesture-handler";
import Animated, {
    FadeIn,
    FadeOut
} from "react-native-reanimated";
import { COLORS } from "../../theme/theme";
import { RoutineExercise } from "../../types/routine";
import { WorkoutSetLog } from "../../types/workout";
import { MensHaptics } from "../../utils/haptics";
import { WorkoutExerciseCard } from "../specific/WorkoutExerciseCard";

// Helper for pure memoization of list items
const TrainingListItem = memo(({
    item, index, logs, isExpanded, completedSets, onToggleExpand,
    onLogSet, onToggleSetComplete, onAddSet, getLastSessionSet, onReplace, onRemove, onRemoveSet
}: any) => {

    const renderRightActions = (progress: RNAnimated.AnimatedInterpolation<number>) => (
        <View style={styles.deleteActionContainer}>
            <RNAnimated.View
                style={[
                    styles.deleteActionInner,
                    {
                        opacity: progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 1] }),
                        transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }]
                    }
                ]}
            >
                <Trash2 size={26} color="#FFFFFF" />
            </RNAnimated.View>
        </View>
    );

    return (
        <Animated.View
            entering={FadeIn.delay(index * 60).duration(300)}
            // layout={LinearTransition...} REMOVED: Causes jumpy behavior on top items
            exiting={FadeOut.duration(300)}
            style={{ marginBottom: 12 }}
        >
            <Swipeable
                friction={2}
                enabled={!isExpanded}
                rightThreshold={80}
                renderRightActions={renderRightActions}
                onSwipeableOpen={(direction) => {
                    if (direction === 'right') {
                        onRemove(item.id);
                        MensHaptics.success();
                    }
                }}
            >
                <WorkoutExerciseCard
                    exercise={item}
                    logs={logs}
                    completedSets={completedSets}
                    isExpanded={isExpanded}
                    onToggleExpand={onToggleExpand}
                    onLogSet={onLogSet}
                    onToggleSetComplete={onToggleSetComplete}
                    onAddSet={onAddSet}
                    getLastSessionSet={getLastSessionSet}
                    onReplace={onReplace}
                    onRemoveSet={onRemoveSet}
                />
            </Swipeable>
        </Animated.View>
    );
}, (prev, next) => {
    // 1. Strict checks on simple props and refs that shouldn't change for unrelated items
    if (prev.isExpanded !== next.isExpanded) return false;
    if (prev.item.id !== next.item.id) return false;
    if (prev.logs !== next.logs) return false; // Array ref check (sufficient as unrelated logs don't iterate)

    // 2. Smart check for completedSets
    // Since completedSets is a new Set reference every time, we must verify if THIS item's status changed.
    // We only check the specific keys relevant to this exercise.
    for (const log of prev.logs) {
        const key = `${prev.item.id}-${log.setIndex}`;
        if (prev.completedSets.has(key) !== next.completedSets.has(key)) {
            return false;
        }
    }

    return true;
});

interface TrainingSessionListProps {
    exercises: RoutineExercise[];
    logs: Record<string, WorkoutSetLog[]>;
    completedSets: Set<string>;
    expandedExerciseId: string | null;
    isEditMode: boolean;
    flatListRef: any;
    onToggleExpand: (id: string) => void;
    onLogSet: (exerciseId: string, setIndex: number, field: "weight" | "reps", value: number) => void;
    onToggleSetComplete: (exerciseId: string, setIndex: number, restSeconds: number) => void;
    onAddSet: (exerciseId: string) => void;
    onRemoveSet: (exerciseId: string, setIndex: number) => void;
    onReplace: (exerciseId: string) => void;
    onRemoveExercise: (exerciseId: string) => void;
    onReorder: (ids: string[]) => void;
    getLastSessionSet: (exerciseId: string, setIndex: number) => { weight: number; reps: number } | null;
    onShowAddExercise: () => void;
}

const TrainingSessionList: React.FC<TrainingSessionListProps> = ({
    exercises,
    logs,
    completedSets,
    expandedExerciseId,
    isEditMode,
    flatListRef,
    onToggleExpand,
    onLogSet,
    onToggleSetComplete,
    onAddSet,
    onRemoveSet,
    onReplace,
    onRemoveExercise,
    onReorder,
    getLastSessionSet,
    onShowAddExercise
}) => {
    const { t } = useTranslation();
    const emptySet = useMemo(() => new Set<string>(), []);
    const AnyFlashList = FlashList as any;

    // Memoize extra data to prevent FlashList from re-rendering everything constantly
    // But logs changes often, so this might not help much unless FlashList is smart (it is)
    const extraData = useMemo(() => ({
        logs,
        completedSets,
        expandedExerciseId,
        isEditMode
    }), [logs, completedSets, expandedExerciseId, isEditMode]);

    const renderFlashListItem = useCallback(({ item, index }: { item: any, index: number }) => (
        <TrainingListItem
            item={item}
            index={index}
            logs={logs[item.id] || []}
            isExpanded={expandedExerciseId === item.id}
            completedSets={completedSets}
            onToggleExpand={onToggleExpand}
            onLogSet={onLogSet}
            onToggleSetComplete={onToggleSetComplete}
            onAddSet={onAddSet}
            getLastSessionSet={getLastSessionSet}
            onReplace={onReplace}
            onRemove={onRemoveExercise}
            onRemoveSet={onRemoveSet}
        />
    ), [logs, completedSets, expandedExerciseId, onToggleExpand, onLogSet, onToggleSetComplete, onAddSet, getLastSessionSet, onReplace, onRemoveExercise, onRemoveSet]);

    const renderDraggableItem = useCallback(({ item, drag, isActive }: RenderItemParams<any>) => (
        <ScaleDecorator activeScale={1.03}>
            <View style={{ marginBottom: 4, opacity: isActive ? 0.8 : 1 }}>
                <WorkoutExerciseCard
                    exercise={item}
                    logs={logs[item.id] || []}
                    completedSets={completedSets}
                    isExpanded={false}
                    onToggleExpand={() => { }}
                    onLogSet={() => { }}
                    onToggleSetComplete={() => { }}
                    onAddSet={() => { }}
                    getLastSessionSet={() => null}
                    onReplace={() => { }}
                    onRemoveSet={() => { }}
                    onLongPress={drag}
                />
            </View>
        </ScaleDecorator>
    ), [logs, completedSets, emptySet]); // Note: emptySet was used in original, check usage

    if (isEditMode) {
        return (
            <DraggableFlatList
                data={exercises}
                keyExtractor={(item) => item.id}
                onDragEnd={({ data }) => onReorder(data.map(e => e.id))}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 180 }}
                activationDistance={10}
                renderItem={renderDraggableItem}
                ListFooterComponent={<View style={{ height: 80 }} />}
            />
        );
    }

    return (
        <AnyFlashList
            ref={flatListRef}
            data={exercises}
            keyExtractor={(item: any) => item.id}
            extraData={extraData}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 180, paddingTop: 0 }}
            estimatedItemSize={120} // Tuned for typical collapsed card height
            renderItem={renderFlashListItem}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={
                <TouchableOpacity
                    style={styles.addExerciseButton}
                    onPress={onShowAddExercise}
                    activeOpacity={0.7}
                >
                    <Plus size={20} color={COLORS.primary} />
                    <Text style={styles.addExerciseButtonText}>{t('train.add_exercise')}</Text>
                </TouchableOpacity>
            }
        />
    );
};

export default memo(TrainingSessionList);

const styles = StyleSheet.create({
    deleteActionContainer: {
        backgroundColor: COLORS.error,
        justifyContent: 'center',
        alignItems: 'flex-end',
        flex: 1,
        borderRadius: 16,
    },
    deleteActionInner: {
        paddingRight: 24,
        justifyContent: 'center',
        height: '100%'
    },
    addExerciseButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderWidth: 2, borderColor: COLORS.primary, borderStyle: 'dashed', borderRadius: 16, marginVertical: 16, gap: 8, backgroundColor: COLORS.surface },
    addExerciseButtonText: { color: COLORS.primary, fontSize: 16, fontWeight: '600' }
});
