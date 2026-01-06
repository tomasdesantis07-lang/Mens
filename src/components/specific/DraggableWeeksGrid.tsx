import * as Haptics from "expo-haptics";
import { Dumbbell } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    measure,
    runOnJS,
    useAnimatedRef,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withTiming
} from "react-native-reanimated";
import { COLORS, TYPOGRAPHY } from "../../theme/theme";
import { RoutineDay } from "../../types/routine";
import { RoutineDayCard } from "./RoutineDayCard";

interface DraggableWeeksGridProps {
    days: RoutineDay[];
    onReorder: (fromIndex: number, toIndex: number) => void;
    onDayPress: (dayIndex: number) => void;
}

const DRAG_ITEM_SIZE = 110;

export const DraggableWeeksGrid: React.FC<DraggableWeeksGridProps> = ({
    days,
    onReorder,
    onDayPress,
}) => {
    const { t } = useTranslation();

    // Layout measurements for drop zones
    const [layouts, setLayouts] = useState<Record<number, { y: number; height: number }>>({});
    const containerHeight = useSharedValue(0);

    const handleLayout = (index: number, event: LayoutChangeEvent) => {
        const { y, height } = event.nativeEvent.layout;
        setLayouts((prev) => ({
            ...prev,
            [index]: { y, height },
        }));
    };

    // Shared values for drag state
    const activeIndex = useSharedValue<number | null>(null);
    const translationX = useSharedValue(0);
    const translationY = useSharedValue(0);
    const absoluteX = useSharedValue(0);
    const absoluteY = useSharedValue(0);
    // Shake rotation removed
    const shakeRotation = useSharedValue(0);

    // Context for gestures
    const context = useSharedValue({ x: 0, y: 0 });

    const activateShake = () => {
        'worklet';
        // Shake disabled per user request
    };

    const stopShake = () => {
        'worklet';
        // Shake disabled per user request
    };

    const handleReorderJS = (from: number, to: number) => {
        onReorder(from, to);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const panGesture = Gesture.Pan()
        .activateAfterLongPress(300)
        .onStart((e) => {
            // Find which item was pressed based on Y coordinate
            // This assumes the gesture handler covers the container. 
            // Better approach: wrap each item or have global handler?
            // Global handler is easier for unrestricted movement.

            // Wait, we need to know WHICH item started the drag.
            // Let's implement individual gesture detectors for each item?
            // "Dragging" usually implies lifting THAT item.
            // But if we lift item A, we want to move it anywhere.

            // To properly track "source", let's pass a handler to each ItemWrapper.
        });

    // We'll create a wrapper component for each item to handle its own gesture

    const DragItemWrapper = ({
        index,
        day
    }: {
        index: number;
        day: RoutineDay
    }) => {
        const isDragging = useDerivedValue(() => activeIndex.value === index);
        const isOtherDragging = useDerivedValue(() => activeIndex.value !== null && activeIndex.value !== index);

        const animatedStyle = useAnimatedStyle(() => {
            return {
                opacity: isDragging.value ? 0 : 1, // Hide original when dragging
                transform: [
                    { scale: withTiming(isOtherDragging.value ? 0.98 : 1) }
                ]
            };
        });

        const gesture = Gesture.Pan()
            .activateAfterLongPress(250)
            .onStart((e) => {
                activeIndex.value = index;
                // Center the drag overlay on the finger directly
                absoluteX.value = e.absoluteX - DRAG_ITEM_SIZE / 2;
                absoluteY.value = e.absoluteY - DRAG_ITEM_SIZE / 2;
                translationX.value = 0;
                translationY.value = 0;
                context.value = { x: absoluteX.value, y: absoluteY.value };

                runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
                activateShake();
            })
            .onUpdate((e) => {
                absoluteX.value = e.absoluteX - DRAG_ITEM_SIZE / 2;
                absoluteY.value = e.absoluteY - DRAG_ITEM_SIZE / 2;
            })
            .onEnd((e) => {
                // Find drop target
                // We compare e.absoluteY relative to container or similar?
                // Layouts are relative to the Container content.
                // e.absoluteY is screen coordinates.
                // We need the scroll offset... This is tricky without `measure`.
                // A simpler way: we assume the gesture coordinate relative to the VIEW
                // For now let's hope layouts[i].y gives us enough info if we subtract container offset?
                // Actually, let's use the touch position relative to the wrapper + wrapper offset?
                // `e.y` is relative to the view.

                // Let's use `onFinalize` to reset.
                // But we need to know WHERE we dropped.

                // Correct approach for Drop Zone in ScrollView:
                // We need to loop through layouts and check if (currentY) is inside [y, y+height].
                // But currentY needs to be in the same coordinate space.
                // Since this component is inside a ScrollView in the parent, getting absolute coordinates is hard.

                // Workaround: 
                // Only support "Swap" if we can confidently identify the target.
                // Maybe using `measure` on the container? 

                // Since we rely on simple list, maybe we can assume regular height?
                // If we can't reliably get the target, this feature is risky.

                // Let's try to capture the container's measurement on screen.
            })
            .onFinalize(() => {

            });

        // We'll define the finalized logic in a "shared" handler or pass refs?

        // Simplified approach for "Swap": 
        // Just checking `absoluteY` against known screen regions is flaky.
        // Let's use `measureInWindow` for keys? Expensive.

        // Is there a simpler way?
        // Dragging a "Proxy" item.
        // Actually, if we use `GestureDetector` on the *Container*, we get X/Y relative to container!
        // `Gesture.Pan()` on container gives `e.y` relative to container (if it's the hit view).
        // But the long press needs to start on an ITEM.

        // Let's stick to: Gesture on Item.
        // `e.absoluteY` is screen. 
        // We need the target item's screen Y.
        // We can measure all items when drag STARTS.
    };

    // Container ref for measurement
    const containerRef = useAnimatedRef<Animated.View>();

    // Ref for View references (for drop detection)
    const viewRefs = React.useRef<Record<number, View | null>>({});

    const handleDragEnd = (dropX: number, dropY: number, startIndex: number) => {
        // Run on JS: check overlap
        // We need to measure all views now.
        // This is async.

        let foundIndex = -1;

        // This is a bit "heavy" but safest for correct drop target
        const promises = days.map((_, i) => new Promise<void>((resolve) => {
            viewRefs.current[i]?.measureInWindow((x, y, width, height) => {
                if (dropY >= y && dropY <= y + height && dropX >= x && dropX <= x + width) {
                    foundIndex = i;
                }
                resolve();
            });
        }));

        Promise.all(promises).then(() => {
            activeIndex.value = null;
            stopShake();

            if (foundIndex !== -1 && foundIndex !== startIndex) {
                // Trigger swap
                handleReorderJS(startIndex, foundIndex);
            }
        });
    };

    return (
        <Animated.View ref={containerRef} style={styles.container}>
            {days.map((day, index) => (
                <DraggableDayItem
                    key={day.dayIndex}
                    index={index}
                    day={day}
                    onPress={() => onDayPress(index)}
                    activeIndex={activeIndex}
                    shakeRotation={shakeRotation}
                    absoluteX={absoluteX}
                    absoluteY={absoluteY}
                    containerRef={containerRef}
                    onDragStart={() => {
                        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
                        activateShake();
                    }}
                    onDragEnd={(x: number, y: number) => {
                        runOnJS(handleDragEnd)(x, y, index);
                    }}
                    setViewRef={(ref: View | null) => { viewRefs.current[index] = ref; }}
                />
            ))}

            <DragOverlay
                activeIndex={activeIndex}
                days={days}
                absoluteX={absoluteX}
                absoluteY={absoluteY}
            />
        </Animated.View>
    );
};

// Sub-component for individual item
const DraggableDayItem = ({
    index, day, onPress, activeIndex, shakeRotation, absoluteX, absoluteY, onDragStart, onDragEnd, setViewRef, containerRef
}: any) => {

    // We need a derived value for styles
    const animatedStyle = useAnimatedStyle(() => {
        const isDragging = activeIndex.value === index;
        const isAnyDragging = activeIndex.value !== null;

        return {
            opacity: isDragging ? 0 : 1,
            transform: [
                { scale: withTiming((!isDragging && isAnyDragging) ? 0.98 : 1) }
            ]
        };
    });

    // State to track initial touch offset
    const startOffset = useSharedValue({ x: 0, y: 0 });

    const gesture = Gesture.Pan()
        .activateAfterLongPress(250)
        .onStart((e) => {
            activeIndex.value = index;

            const measurements = measure(containerRef);
            if (measurements) {
                // measurements.pageX/pageY are screen coordinates of the container
                const containerX = measurements.pageX;
                const containerY = measurements.pageY;

                // e.absoluteX/Y are screen coordinates of the touch
                // Calculate position relative to container
                const relativeX = e.absoluteX - containerX;
                const relativeY = e.absoluteY - containerY;

                // Center item on touch
                const centeredX = relativeX - DRAG_ITEM_SIZE / 2;
                const centeredY = relativeY - DRAG_ITEM_SIZE / 2;

                absoluteX.value = centeredX;
                absoluteY.value = centeredY;

                // Save the starting relative position to apply translation deltas
                startOffset.value = { x: centeredX, y: centeredY };
            }

            runOnJS(onDragStart)();
        })
        .onUpdate((e) => {
            absoluteX.value = startOffset.value.x + e.translationX;
            absoluteY.value = startOffset.value.y + e.translationY;
        })
        .onEnd((e) => {
            runOnJS(onDragEnd)(e.absoluteX, e.absoluteY);
        });

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View
                ref={setViewRef}
                style={[styles.itemWrapper, animatedStyle]}
            >
                <RoutineDayCard
                    day={day}
                    onPress={onPress} // Tap works if LongPress fails
                    variant={day.exercises.length === 0 ? "empty" : "filled"}
                />
            </Animated.View>
        </GestureDetector>
    );
};

// Overlay component
const DragOverlay = ({ activeIndex, days, absoluteX, absoluteY }: any) => {
    const { t } = useTranslation();

    const style = useAnimatedStyle(() => {
        if (activeIndex.value === null) {
            return { display: 'none' };
        }

        return {
            display: 'flex',
            position: 'absolute',
            top: 0,
            left: 0,
            width: DRAG_ITEM_SIZE,
            height: DRAG_ITEM_SIZE,
            transform: [
                { translateX: absoluteX.value },
                { translateY: absoluteY.value },
                // Add a slight tilt for style
                { rotate: '-5deg' },
                { scale: 1.1 }
            ],
            zIndex: 9999, // On top of everything
        };
    });

    // Content of the dragged item
    // We need to render the content based on activeIndex
    // Since this is inside a component, we can access props.
    // BUT Reanimated styles run on UI thread, we can't easily swap content unless we render all?
    // Or use `runOnJS` to set a state?
    // State updates might be slow.
    // Better: Render a generic "Active Item" if we can pass the data via shared value? No.
    // We can just use a React state for "draggedItemData" updated on Start.

    // Actually, `activeDragItem` can be a state.
    const [draggedItem, setDraggedItem] = useState<RoutineDay | null>(null);

    useDerivedValue(() => {
        const idx = activeIndex.value;
        if (idx !== null && idx >= 0 && idx < days.length) {
            runOnJS(setDraggedItem)(days[idx]);
        }
    });

    if (!draggedItem) return <Animated.View style={style} />;

    return (
        <Animated.View style={[styles.dragOverlay, style]} pointerEvents="none">
            <View style={styles.dragContent}>
                <Text style={styles.dragLabel} numberOfLines={1}>
                    {draggedItem.label}
                </Text>
                <View style={styles.dragBadge}>
                    <Dumbbell color={COLORS.primary} size={16} />
                    <Text style={styles.dragCount}>
                        {draggedItem.exercises.length}
                    </Text>
                </View>
                <Text style={styles.dragHint}>{t('routines.drag_drop_hint', 'Soltar para mover')}</Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        gap: 12,
        position: 'relative', // For overlay
    },
    itemWrapper: {
        width: '100%',
    },
    dragOverlay: {
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        padding: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    dragContent: {
        alignItems: 'center',
        gap: 8,
    },
    dragLabel: {
        ...TYPOGRAPHY.h4,
        color: COLORS.textInverse,
        fontSize: 14,
        textAlign: 'center',
    },
    dragBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    dragCount: {
        color: COLORS.textInverse,
        fontWeight: '700',
        fontSize: 16,
    },
    dragHint: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
        fontWeight: '600',
        marginTop: 4,
    }
});
