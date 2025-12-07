import { useWorkout } from "../context/WorkoutContext";

export const TAB_BAR_HEIGHT = 60;
export const TAB_BAR_BOTTOM_MARGIN = 20;
export const WORKOUT_OVERLAY_HEIGHT = 70;

export const useTabBarInset = () => {
    const { activeWorkout } = useWorkout();

    const baseInset = TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_MARGIN + 10; // Extra 10px buffer
    const withWorkout = baseInset + WORKOUT_OVERLAY_HEIGHT;

    return activeWorkout ? withWorkout : baseInset;
};
