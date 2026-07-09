export type ThreadUnreadInput = {
    /** The arriving message is a thread reply (carries a `threadRootId`). */
    isReply: boolean;
    /** The reply was authored by the current user (own replies never dot). */
    isOwnReply: boolean;
    /**
     * The viewer follows the reply's thread — they authored its root, replied in
     * it, or were @mentioned. Only followed threads raise a dot, matching the
     * server's `threadUnread` derivation.
     */
    isFollowedThread: boolean;
    /**
     * The thread is open in the panel and the tab is focused, so the reply is
     * already being read and must not raise a dot. A blurred panel still dots,
     * mirroring how a blurred channel still badges.
     */
    isViewingThreadFocused: boolean;
    /**
     * Thread dots are suppressed for this channel (muted or a level below "all"),
     * mirroring the sidebar's unread-badge suppression.
     */
    isSuppressed: boolean;
};

/**
 * Decide whether a freshly-arrived realtime reply should raise the unread dot on
 * its root's "N replies" affordance.
 *
 * The gate mirrors the server's per-viewer `threadUnread` derivation so a live
 * dot and a navigation-time dot agree: a reply only dots a thread the viewer
 * follows, authored by someone else, while they are not already reading it and
 * the channel isn't silenced.
 */
export function shouldFlagThreadUnread(input: ThreadUnreadInput): boolean {
    if (!input.isReply || input.isOwnReply) {
        return false;
    }

    if (!input.isFollowedThread || input.isSuppressed) {
        return false;
    }

    return !input.isViewingThreadFocused;
}
