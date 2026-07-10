import { nextTick, ref } from 'vue';
import type { Ref } from 'vue';

/**
 * Distance (px) from the bottom within which the timeline stays pinned to the
 * newest message, so an incoming message never yanks a reader who has scrolled
 * up into older history.
 */
export const NEAR_BOTTOM_THRESHOLD = 120;

/**
 * Shared scroll/pin bookkeeping for a message timeline.
 *
 * Owns the "near the bottom?" threshold, the pinned-to-newest flag, and the
 * count of messages that have arrived while the reader is scrolled up. Both the
 * main channel timeline and the thread panel drive their floating
 * "jump to latest / N new messages" control from this single source of truth so
 * the two can't drift apart.
 *
 * The composable never attaches its own listeners: the consumer binds `onScroll`
 * to the container's `@scroll` event, keeping this lifecycle-free and unit
 * testable.
 */
export function useScrollPin(container: Ref<HTMLElement | null>) {
    // Whether the view is currently anchored to the newest message. Optimistic
    // on mount (reverse InfiniteScroll lands at the bottom) until the first
    // scroll event corrects it.
    const pinnedToBottom = ref(true);

    // Messages that have arrived while the reader is scrolled up, surfaced as the
    // "N new messages" state on the jump-to-latest control.
    const newMessageCount = ref(0);

    /**
     * Whether the container is scrolled to within `NEAR_BOTTOM_THRESHOLD` of the
     * bottom. A missing element counts as pinned, matching the mount-time state.
     */
    function isNearBottom(): boolean {
        const el = container.value;

        if (!el) {
            return true;
        }

        return (
            el.scrollHeight - el.scrollTop - el.clientHeight <=
            NEAR_BOTTOM_THRESHOLD
        );
    }

    /**
     * Anchor the view to the newest message, clearing the pinned flag and the
     * unread count. `smooth` animates the jump for user-initiated returns; the
     * automatic pin on a live append passes it falsy for an instant snap.
     */
    function scrollToBottom(smooth = false): void {
        const el = container.value;

        if (el) {
            el.scrollTo({
                top: el.scrollHeight,
                behavior: smooth ? 'smooth' : 'auto',
            });
        }

        pinnedToBottom.value = true;
        newMessageCount.value = 0;
    }

    /**
     * React to a freshly appended message. `wasNearBottom` is captured by the
     * caller *before* the DOM grows: when true the view follows the message to
     * the bottom; otherwise the arrival is counted so the control can offer a
     * jump. The scroll is deferred a tick so the new row is laid out first.
     */
    function notifyAppended(wasNearBottom: boolean): void {
        if (wasNearBottom) {
            nextTick(() => scrollToBottom());

            return;
        }

        newMessageCount.value += 1;
    }

    /**
     * Recompute the pinned flag from the live scroll position, clearing the
     * unread count once the reader reaches the bottom under their own steam.
     */
    function onScroll(): void {
        const near = isNearBottom();
        pinnedToBottom.value = near;

        if (near) {
            newMessageCount.value = 0;
        }
    }

    /**
     * Return to the pinned, zero-count baseline, e.g. when switching channels.
     */
    function reset(): void {
        pinnedToBottom.value = true;
        newMessageCount.value = 0;
    }

    return {
        pinnedToBottom,
        newMessageCount,
        isNearBottom,
        scrollToBottom,
        notifyAppended,
        onScroll,
        reset,
    };
}
