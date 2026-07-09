import { describe, expect, it } from 'vitest';
import { shouldFlagThreadUnread } from '@/lib/shouldFlagThreadUnread';
import type { ThreadUnreadInput } from '@/lib/shouldFlagThreadUnread';

/**
 * A qualifying baseline: someone else's reply landing in a followed thread the
 * viewer isn't looking at, in an unsilenced channel. Each test overrides one axis.
 */
function input(overrides: Partial<ThreadUnreadInput> = {}): ThreadUnreadInput {
    return {
        isReply: true,
        isOwnReply: false,
        isFollowedThread: true,
        isViewingThreadFocused: false,
        isSuppressed: false,
        ...overrides,
    };
}

describe('shouldFlagThreadUnread', () => {
    it('flags a reply from someone else in a followed thread', () => {
        expect(shouldFlagThreadUnread(input())).toBe(true);
    });

    it('never flags a non-reply message', () => {
        expect(shouldFlagThreadUnread(input({ isReply: false }))).toBe(false);
    });

    it("never flags the viewer's own reply", () => {
        expect(shouldFlagThreadUnread(input({ isOwnReply: true }))).toBe(false);
    });

    it('does not flag a thread the viewer does not follow', () => {
        expect(shouldFlagThreadUnread(input({ isFollowedThread: false }))).toBe(
            false,
        );
    });

    it('does not flag while the thread is open and the tab is focused', () => {
        expect(
            shouldFlagThreadUnread(input({ isViewingThreadFocused: true })),
        ).toBe(false);
    });

    it('flags while the thread is open but the tab is blurred', () => {
        expect(
            shouldFlagThreadUnread(input({ isViewingThreadFocused: false })),
        ).toBe(true);
    });

    it('does not flag when thread dots are suppressed', () => {
        expect(shouldFlagThreadUnread(input({ isSuppressed: true }))).toBe(
            false,
        );
    });
});
