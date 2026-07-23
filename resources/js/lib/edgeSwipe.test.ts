import { describe, expect, it } from 'vitest';

import { swipeIntent } from '@/lib/edgeSwipe';

/** A left-edge start, as a phone's back-swipe zone would report it. */
const fromEdge = { startX: 6, startY: 300, viewportWidth: 390 };

describe('swipeIntent', () => {
    it('opens the dock on a rightward drag that began at the left edge', () => {
        expect(swipeIntent({ ...fromEdge, endX: 90, endY: 306 })).toBe('open');
    });

    it('ignores a rightward drag that began away from the edge', () => {
        expect(
            swipeIntent({
                startX: 120,
                startY: 300,
                viewportWidth: 390,
                endX: 220,
                endY: 306,
            }),
        ).toBe(null);
    });

    it('ignores a drag too short to be deliberate', () => {
        expect(swipeIntent({ ...fromEdge, endX: 40, endY: 300 })).toBe(null);
    });

    it('ignores a drag that is mostly vertical', () => {
        // Scrolling the timeline with a thumb near the edge must not open the
        // dock, however far the finger travels.
        expect(swipeIntent({ ...fromEdge, endX: 90, endY: 500 })).toBe(null);
    });

    it('closes the dock on a leftward drag, wherever it began', () => {
        expect(
            swipeIntent({
                startX: 250,
                startY: 300,
                viewportWidth: 390,
                endX: 120,
                endY: 306,
            }),
        ).toBe('close');
    });

    it('ignores a leftward drag too short to be deliberate', () => {
        expect(
            swipeIntent({
                startX: 250,
                startY: 300,
                viewportWidth: 390,
                endX: 220,
                endY: 300,
            }),
        ).toBe(null);
    });
});
