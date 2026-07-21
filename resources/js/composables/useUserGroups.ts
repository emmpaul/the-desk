import { usePage } from '@inertiajs/vue3';
import { computed } from 'vue';
import type { ComputedRef } from 'vue';

type UserGroup = App.Data.UserGroupData;

/**
 * Read the current workspace's mentionable user groups, shared on every
 * in-workspace request. One source for the composer's `@` menu and for the
 * anti-spoof check that decides whether a `group:<id>` token in a message body
 * renders as a pill or as plain text, so the two can never drift.
 */
export function useUserGroups(): {
    groups: ComputedRef<UserGroup[]>;
    search: (query: string) => UserGroup[];
} {
    const page = usePage();

    const groups = computed<UserGroup[]>(() => page.props.userGroups ?? []);

    return {
        groups,
        search: (query) => {
            const needle = query.trim().toLowerCase();

            if (needle === '') {
                return groups.value;
            }

            // Matched on both the handle people type and the display name they
            // remember it by, so `@dev` finds "Dev Team" either way.
            return groups.value.filter(
                (group) =>
                    group.slug.includes(needle) ||
                    group.name.toLowerCase().includes(needle),
            );
        },
    };
}
