import { describe, expect, it } from 'vitest';
import { unreadDividerMessageId } from '@/lib/unreadDivider';

/**
 * A minimal message row for boundary computation: only the id and author matter.
 */
function message(id: string, userId: string) {
    return { id, user: { id: userId, name: `User ${userId}` } };
}

const ME = 'me';
const PEER = 'peer';

describe('unreadDividerMessageId', () => {
    it('marks the first message posted after the read pointer', () => {
        const messages = [
            message('1', PEER),
            message('2', PEER),
            message('3', PEER),
            message('4', PEER),
        ];

        expect(unreadDividerMessageId(messages, '2', ME)).toBe('3');
    });

    it('returns null when every message has been read', () => {
        const messages = [message('1', PEER), message('2', PEER)];

        expect(unreadDividerMessageId(messages, '2', ME)).toBeNull();
    });

    it('treats a null pointer as an entirely unread channel', () => {
        const messages = [message('1', PEER), message('2', PEER)];

        expect(unreadDividerMessageId(messages, null, ME)).toBe('1');
    });

    it("skips the reader's own messages at the boundary", () => {
        const messages = [
            message('1', PEER),
            message('2', ME),
            message('3', ME),
            message('4', PEER),
        ];

        // Read up to 1; 2 and 3 are your own, so the "New" line sits above 4.
        expect(unreadDividerMessageId(messages, '1', ME)).toBe('4');
    });

    it("returns null when the only unread messages are the reader's own", () => {
        const messages = [
            message('1', PEER),
            message('2', ME),
            message('3', ME),
        ];

        expect(unreadDividerMessageId(messages, '1', ME)).toBeNull();
    });

    it('ignores non-numeric ids from optimistic sends awaiting confirmation', () => {
        const messages = [
            message('1', PEER),
            message('c1d2-uuid', ME),
            message('2', PEER),
        ];

        expect(unreadDividerMessageId(messages, '1', ME)).toBe('2');
    });

    it('returns null for an empty channel', () => {
        expect(unreadDividerMessageId([], '5', ME)).toBeNull();
    });
});
