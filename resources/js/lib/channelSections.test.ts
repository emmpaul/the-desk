import { describe, expect, it } from 'vitest';
import {
    partitionChannels,
    toggleCollapsedSection,
} from '@/lib/channelSections';
import type { Channel } from '@/types/channels';

/**
 * A minimal channel with only the fields the section helpers read; `starred`
 * defaults to false and is overridden per case.
 */
function channel(overrides: Partial<Channel> = {}): Channel {
    return {
        id: overrides.id ?? overrides.slug ?? 'id',
        name: overrides.name ?? 'General',
        slug: overrides.slug ?? 'general',
        visibility: 'public',
        topic: null,
        isGeneral: false,
        isArchived: false,
        muted: false,
        notificationLevel: 'all',
        unreadCount: 0,
        mentionCount: 0,
        hasDraft: false,
        draft: null,
        starred: false,
        ...overrides,
    };
}

describe('partitionChannels', () => {
    it('splits starred channels from the rest', () => {
        const alpha = channel({ slug: 'alpha', starred: true });
        const beta = channel({ slug: 'beta' });
        const gamma = channel({ slug: 'gamma', starred: true });

        const { starred, others } = partitionChannels([alpha, beta, gamma]);

        expect(starred.map((c) => c.slug)).toEqual(['alpha', 'gamma']);
        expect(others.map((c) => c.slug)).toEqual(['beta']);
    });

    it('preserves the incoming order within each group', () => {
        const channels = [
            channel({ slug: 'zebra', starred: true }),
            channel({ slug: 'apple', starred: true }),
        ];

        expect(partitionChannels(channels).starred.map((c) => c.slug)).toEqual([
            'zebra',
            'apple',
        ]);
    });

    it('returns empty groups for an empty list', () => {
        expect(partitionChannels([])).toEqual({ starred: [], others: [] });
    });

    it('puts everything in others when nothing is starred', () => {
        const { starred, others } = partitionChannels([
            channel({ slug: 'a' }),
            channel({ slug: 'b' }),
        ]);

        expect(starred).toEqual([]);
        expect(others.map((c) => c.slug)).toEqual(['a', 'b']);
    });
});

describe('toggleCollapsedSection', () => {
    it('collapses a section that was expanded', () => {
        expect(toggleCollapsedSection([], 'starred')).toEqual(['starred']);
    });

    it('expands a section that was collapsed', () => {
        expect(
            toggleCollapsedSection(['starred', 'channels'], 'starred'),
        ).toEqual(['channels']);
    });

    it('does not mutate the input array', () => {
        const collapsed = ['channels'];
        toggleCollapsedSection(collapsed, 'starred');
        expect(collapsed).toEqual(['channels']);
    });
});
