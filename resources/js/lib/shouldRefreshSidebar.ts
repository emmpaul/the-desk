export type SidebarRefreshInput = {
    /** The message was authored by the current user (own messages never badge). */
    isOwnMessage: boolean;
    /**
     * The message counts as ordinary channel traffic — a top-level message or a
     * thread reply also broadcast to the channel. Thread-only replies are `false`
     * and only move a badge through the mention path, mirroring how the server's
     * sidebar unread query excludes them.
     */
    isChannelMessage: boolean;
    /** The current user is directly @mentioned by the message. */
    mentionsCurrentUser: boolean;
    /** The message landed in the channel the user is actively viewing on screen. */
    isActiveChannel: boolean;
    /** The browser tab currently has focus. */
    tabHasFocus: boolean;
};

/**
 * Decide whether a freshly-arrived realtime message should refresh the sidebar's
 * unread and mention badges (a partial reload of the shared `channels` prop).
 *
 * The gate mirrors the server's badge query so a live badge and a navigation-time
 * badge agree: a message only moves a count when it is ordinary channel traffic or
 * a direct @mention — a thread-only reply without a mention lives in the thread
 * view and never touches the plain count. A user's own message never counts as
 * unread. The actively-viewed channel is skipped only while its tab is focused,
 * because Show.vue is already advancing its read pointer and reloading the sidebar;
 * blurred, that channel must badge like any other.
 */
export function shouldRefreshSidebar(input: SidebarRefreshInput): boolean {
    if (input.isOwnMessage) {
        return false;
    }

    if (!input.isChannelMessage && !input.mentionsCurrentUser) {
        return false;
    }

    if (input.isActiveChannel && input.tabHasFocus) {
        return false;
    }

    return true;
}
