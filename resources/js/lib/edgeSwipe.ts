/** How close to the screen edge a drag must begin to count as an edge swipe. */
const EDGE_ZONE_PX = 24;

/** How far a drag must travel horizontally before it reads as deliberate. */
const MIN_TRAVEL_PX = 56;

/**
 * A completed drag, in viewport coordinates.
 */
export type Swipe = {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    viewportWidth: number;
};

/** What a completed drag asks of the dock, or null if it asks nothing. */
export type SwipeIntent = 'open' | 'close' | null;

/**
 * Read a completed drag as an instruction to the dock.
 *
 * Opening is deliberately harder than closing: it only counts from the screen's
 * left edge, so a rightward drag in the middle of the conversation (swiping a
 * message, panning an image) never pulls the dock out. Closing counts anywhere,
 * because by then the dock is what the finger is on.
 *
 * A drag that travels further vertically than horizontally is someone scrolling,
 * not swiping, however far it goes.
 */
export function swipeIntent({
    startX,
    startY,
    endX,
    endY,
    viewportWidth,
}: Swipe): SwipeIntent {
    const travelX = endX - startX;

    if (Math.abs(travelX) < MIN_TRAVEL_PX) {
        return null;
    }

    if (Math.abs(endY - startY) > Math.abs(travelX)) {
        return null;
    }

    if (travelX < 0) {
        return 'close';
    }

    return startX <= EDGE_ZONE_PX && startX <= viewportWidth ? 'open' : null;
}
