import { onBeforeUnmount, onMounted } from 'vue';
import type { Ref } from 'vue';
import { swipeIntent } from '@/lib/edgeSwipe';

type EdgeSwipeOptions = {
    /** Whether the gesture is live — it is a touch affordance, so mobile only. */
    enabled: Ref<boolean>;
    /** Pull the panel out. */
    onOpen: () => void;
    /** Push it back. */
    onClose: () => void;
};

/**
 * Open a left-edge panel by swiping in from the screen edge, and close it by
 * swiping back out.
 *
 * Bound to touch and pen only: a mouse drag from the window's left edge is
 * someone selecting text, not reaching for the dock.
 */
export function useEdgeSwipe({
    enabled,
    onOpen,
    onClose,
}: EdgeSwipeOptions): void {
    let start: { x: number; y: number } | null = null;

    function onPointerDown(event: PointerEvent): void {
        start =
            enabled.value && event.pointerType !== 'mouse'
                ? { x: event.clientX, y: event.clientY }
                : null;
    }

    function onPointerUp(event: PointerEvent): void {
        if (!start) {
            return;
        }

        const intent = swipeIntent({
            startX: start.x,
            startY: start.y,
            endX: event.clientX,
            endY: event.clientY,
            viewportWidth: window.innerWidth,
        });

        start = null;

        if (intent === 'open') {
            onOpen();
        } else if (intent === 'close') {
            onClose();
        }
    }

    onMounted(() => {
        document.addEventListener('pointerdown', onPointerDown, {
            passive: true,
        });
        document.addEventListener('pointerup', onPointerUp, { passive: true });
    });

    onBeforeUnmount(() => {
        document.removeEventListener('pointerdown', onPointerDown);
        document.removeEventListener('pointerup', onPointerUp);
    });
}
