import type { Message } from '@/types';

/**
 * The id of the message where a "New messages" divider should sit — the first
 * message the reader has not yet seen, or null when there is no boundary to mark.
 *
 * `lastReadMessageId` is the read pointer captured when the channel opened; a
 * message is unread when its id sorts after that pointer. A null pointer means
 * the channel has never been read, so every message counts as unread. The
 * reader's own messages at the boundary are skipped — you don't need a "new"
 * marker above something you just posted — so an entirely-own unread tail yields
 * null.
 *
 * Message ids are monotonic auto-increment values delivered as numeric strings,
 * so the comparison is numeric. A non-numeric id (an optimistic send still keyed
 * by its client uuid) is never treated as unread: those are always the reader's
 * own, and the boundary is fixed at channel open rather than moved by later
 * traffic.
 */
export function unreadDividerMessageId(
    messages: Pick<Message, 'id' | 'user'>[],
    lastReadMessageId: string | null,
    currentUserId: string,
): string | null {
    const readPointer =
        lastReadMessageId === null ? -Infinity : Number(lastReadMessageId);

    for (const message of messages) {
        const id = Number(message.id);

        if (!Number.isFinite(id) || id <= readPointer) {
            continue;
        }

        if (message.user.id === currentUserId) {
            continue;
        }

        return message.id;
    }

    return null;
}
