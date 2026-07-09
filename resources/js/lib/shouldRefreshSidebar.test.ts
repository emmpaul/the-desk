import { describe, expect, it } from 'vitest';
import { shouldRefreshSidebar } from '@/lib/shouldRefreshSidebar';
import type { SidebarRefreshInput } from '@/lib/shouldRefreshSidebar';

/**
 * A qualifying baseline: an ordinary message from someone else landing in a
 * background channel while the tab is blurred. Each test overrides one axis.
 */
function input(
    overrides: Partial<SidebarRefreshInput> = {},
): SidebarRefreshInput {
    return {
        isOwnMessage: false,
        isChannelMessage: true,
        mentionsCurrentUser: false,
        isActiveChannel: false,
        tabHasFocus: false,
        ...overrides,
    };
}

describe('shouldRefreshSidebar', () => {
    it('refreshes for an ordinary message in a background channel', () => {
        expect(shouldRefreshSidebar(input())).toBe(true);
    });

    it("never refreshes for the user's own message", () => {
        expect(shouldRefreshSidebar(input({ isOwnMessage: true }))).toBe(false);
    });

    it('does not refresh for a thread-only reply that does not mention the user', () => {
        expect(shouldRefreshSidebar(input({ isChannelMessage: false }))).toBe(
            false,
        );
    });

    it('refreshes for a thread-only reply that mentions the user', () => {
        expect(
            shouldRefreshSidebar(
                input({ isChannelMessage: false, mentionsCurrentUser: true }),
            ),
        ).toBe(true);
    });

    it('does not refresh for the active channel while the tab is focused', () => {
        expect(
            shouldRefreshSidebar(
                input({ isActiveChannel: true, tabHasFocus: true }),
            ),
        ).toBe(false);
    });

    it('refreshes for the active channel while the tab is blurred', () => {
        expect(
            shouldRefreshSidebar(
                input({ isActiveChannel: true, tabHasFocus: false }),
            ),
        ).toBe(true);
    });

    it('refreshes for a background channel while the tab is focused elsewhere', () => {
        expect(
            shouldRefreshSidebar(
                input({ isActiveChannel: false, tabHasFocus: true }),
            ),
        ).toBe(true);
    });
});
