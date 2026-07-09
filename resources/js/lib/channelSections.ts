import type { Channel } from '@/types/channels';

/**
 * The built-in sidebar sections whose collapsed state is persisted per user.
 * Keys must match `App\Http\Requests\UpdateSidebarSectionsRequest::SECTIONS`.
 */
export const SIDEBAR_SECTIONS = ['starred', 'channels'] as const;

export type SidebarSectionKey = (typeof SIDEBAR_SECTIONS)[number];

export type ChannelSections = {
    /** Channels the viewer has starred, pinned above the main list. */
    starred: Channel[];
    /** Every remaining channel the viewer belongs to. */
    others: Channel[];
};

/**
 * Split the sidebar's channels into the pinned "Starred" section and the main
 * "Channels" list, preserving the incoming order within each group (the server
 * already sorts alphabetically).
 */
export function partitionChannels(channels: Channel[]): ChannelSections {
    const starred: Channel[] = [];
    const others: Channel[] = [];

    for (const channel of channels) {
        if (channel.starred) {
            starred.push(channel);
        } else {
            others.push(channel);
        }
    }

    return { starred, others };
}

/**
 * Toggle a section key within the collapsed set, returning a new array. Adding a
 * key collapses the section; removing it expands the section. Unknown keys are
 * left untouched so a stale value never blocks the toggle.
 */
export function toggleCollapsedSection(
    collapsed: readonly string[],
    key: SidebarSectionKey,
): string[] {
    return collapsed.includes(key)
        ? collapsed.filter((section) => section !== key)
        : [...collapsed, key];
}
