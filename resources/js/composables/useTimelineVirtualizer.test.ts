import { describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';

// A minimal stand-in for the TanStack core virtualizer: only the members the
// composable reads or delegates to. `useVirtualizer` returns it wrapped in a ref,
// mirroring the real adapter.
const virtualizerStub = {
    getVirtualItems: () => [],
    getTotalSize: () => 0,
    isScrolling: false,
    range: { startIndex: 0, endIndex: 0 },
    scrollToIndex: vi.fn(),
    scrollToEnd: vi.fn(),
    measureElement: vi.fn(),
};

vi.mock('@tanstack/vue-virtual', () => ({
    useVirtualizer: () => ref(virtualizerStub),
}));

import { useTimelineVirtualizer } from '@/composables/useTimelineVirtualizer';

function makeVirtualizer() {
    return useTimelineVirtualizer({
        scrollElement: ref(null),
        count: computed(() => 10),
        hasOlder: () => false,
        isLoadingOlder: () => false,
        loadOlder: () => {},
    });
}

describe('useTimelineVirtualizer', () => {
    it('delegates scrollToEnd to the virtualizer with the given behavior', () => {
        virtualizerStub.scrollToEnd.mockClear();
        const { scrollToEnd } = makeVirtualizer();

        scrollToEnd('smooth');

        expect(virtualizerStub.scrollToEnd).toHaveBeenCalledWith({
            behavior: 'smooth',
        });
    });

    it('defaults scrollToEnd to an instant scroll', () => {
        virtualizerStub.scrollToEnd.mockClear();
        const { scrollToEnd } = makeVirtualizer();

        scrollToEnd();

        expect(virtualizerStub.scrollToEnd).toHaveBeenCalledWith({
            behavior: 'auto',
        });
    });

    it('delegates scrollToIndex to the virtualizer with alignment', () => {
        virtualizerStub.scrollToIndex.mockClear();
        const { scrollToIndex } = makeVirtualizer();

        scrollToIndex(3, 'start');

        expect(virtualizerStub.scrollToIndex).toHaveBeenCalledWith(3, {
            align: 'start',
        });
    });
});
