import { describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import {
    NEAR_BOTTOM_THRESHOLD,
    useScrollPin,
} from '@/composables/useScrollPin';

/**
 * A stand-in for the scroll container, exposing just the geometry the composable
 * reads plus a `scrollTo` spy. `scrollTo` moves the element to the bottom so a
 * subsequent `isNearBottom()` reflects the pinned position, mirroring the DOM.
 */
function fakeElement(geometry: {
    scrollHeight: number;
    scrollTop: number;
    clientHeight: number;
}): HTMLElement {
    const el = {
        ...geometry,
        scrollTo: vi.fn((options: ScrollToOptions) => {
            el.scrollTop = (options.top ?? 0) as number;
        }),
    };

    return el as unknown as HTMLElement;
}

describe('useScrollPin', () => {
    it('treats a missing container as pinned to the bottom', () => {
        const { isNearBottom } = useScrollPin(ref(null));

        expect(isNearBottom()).toBe(true);
    });

    it('reports near-bottom at and within the threshold, but not beyond it', () => {
        const el = fakeElement({
            scrollHeight: 1000,
            clientHeight: 100,
            // Exactly NEAR_BOTTOM_THRESHOLD from the bottom.
            scrollTop: 1000 - 100 - NEAR_BOTTOM_THRESHOLD,
        });
        const { isNearBottom } = useScrollPin(ref(el));

        expect(isNearBottom()).toBe(true);

        // One pixel further up crosses the threshold.
        el.scrollTop -= 1;
        expect(isNearBottom()).toBe(false);
    });

    it('counts appends that arrive while scrolled up, without moving the view', () => {
        const el = fakeElement({
            scrollHeight: 1000,
            clientHeight: 100,
            scrollTop: 0,
        });
        const { newMessageCount, notifyAppended } = useScrollPin(ref(el));

        notifyAppended(false);
        notifyAppended(false);

        expect(newMessageCount.value).toBe(2);
        expect(el.scrollTo).not.toHaveBeenCalled();
    });

    it('scrolls to the bottom instead of counting when the reader was near it', async () => {
        const el = fakeElement({
            scrollHeight: 1000,
            clientHeight: 100,
            scrollTop: 900,
        });
        const { newMessageCount, notifyAppended } = useScrollPin(ref(el));

        notifyAppended(true);
        await nextTick();

        expect(newMessageCount.value).toBe(0);
        expect(el.scrollTo).toHaveBeenCalledWith({
            top: 1000,
            behavior: 'auto',
        });
    });

    it('scrolls smoothly and clears the unread count on an explicit jump', () => {
        const el = fakeElement({
            scrollHeight: 1000,
            clientHeight: 100,
            scrollTop: 0,
        });
        const {
            newMessageCount,
            pinnedToBottom,
            notifyAppended,
            scrollToBottom,
        } = useScrollPin(ref(el));

        notifyAppended(false);
        expect(newMessageCount.value).toBe(1);

        scrollToBottom(true);

        expect(el.scrollTo).toHaveBeenCalledWith({
            top: 1000,
            behavior: 'smooth',
        });
        expect(newMessageCount.value).toBe(0);
        expect(pinnedToBottom.value).toBe(true);
    });

    it('re-pins and clears the count once the reader scrolls back to the bottom', () => {
        const el = fakeElement({
            scrollHeight: 1000,
            clientHeight: 100,
            scrollTop: 0,
        });
        const { newMessageCount, pinnedToBottom, notifyAppended, onScroll } =
            useScrollPin(ref(el));

        // Scrolled up: a new arrival is counted and the view is unpinned.
        notifyAppended(false);
        onScroll();
        expect(pinnedToBottom.value).toBe(false);
        expect(newMessageCount.value).toBe(1);

        // The reader drags back to the bottom.
        el.scrollTop = 900;
        onScroll();
        expect(pinnedToBottom.value).toBe(true);
        expect(newMessageCount.value).toBe(0);
    });

    it('reset returns to the pinned, zero-count baseline', () => {
        const el = fakeElement({
            scrollHeight: 1000,
            clientHeight: 100,
            scrollTop: 0,
        });
        const {
            newMessageCount,
            pinnedToBottom,
            notifyAppended,
            onScroll,
            reset,
        } = useScrollPin(ref(el));

        notifyAppended(false);
        onScroll();
        expect(pinnedToBottom.value).toBe(false);
        expect(newMessageCount.value).toBe(1);

        reset();

        expect(pinnedToBottom.value).toBe(true);
        expect(newMessageCount.value).toBe(0);
    });
});
