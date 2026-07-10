import type { Mention } from '@/types';

/**
 * The masthead's overlapping member avatars: the first `max` members render as
 * circles and the remainder collapse into a single `+N` overflow chip.
 */
export type MemberAvatarStack = {
    visible: Mention[];
    overflow: number;
};

/**
 * Split a channel's member roster into the avatars the masthead shows and the
 * count it hides behind a `+N` chip.
 *
 * At most `max` members render as avatars (a non-positive `max` shows none); the
 * rest become the overflow count, which never drops below zero.
 */
export function memberAvatarStack(
    members: Mention[],
    max: number,
): MemberAvatarStack {
    const visible = max > 0 ? members.slice(0, max) : [];

    return {
        visible,
        overflow: members.length - visible.length,
    };
}
