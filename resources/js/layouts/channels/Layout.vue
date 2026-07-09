<script setup lang="ts">
import { Link, router, usePage } from '@inertiajs/vue3';
import {
    ChevronRight,
    MessageSquareText,
    MessagesSquare,
    Plus,
    Search,
} from '@lucide/vue';
import { computed, onMounted, ref, watch } from 'vue';
import { toast } from 'vue-sonner';
import {
    browse,
    show,
} from '@/actions/App/Http/Controllers/Channels/ChannelController';
import { index as searchMessages } from '@/actions/App/Http/Controllers/Channels/SearchController';
import { index as threadsInbox } from '@/actions/App/Http/Controllers/Channels/ThreadsController';
import { update as updateSidebarSections } from '@/actions/App/Http/Controllers/SidebarSectionController';
import ChannelListItem from '@/components/ChannelListItem.vue';
import CreateChannelModal from '@/components/CreateChannelModal.vue';
import CreateTeamModal from '@/components/CreateTeamModal.vue';
import KeyboardShortcutsModal from '@/components/KeyboardShortcutsModal.vue';
import NavUser from '@/components/NavUser.vue';
import PendingInvitationsModal from '@/components/PendingInvitationsModal.vue';
import QuickSwitcher from '@/components/QuickSwitcher.vue';
import TeamSwitcher from '@/components/TeamSwitcher.vue';
import { Separator } from '@/components/ui/separator';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupAction,
    SidebarGroupContent,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
} from '@/components/ui/sidebar';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { adjacentSlug } from '@/composables/keyboardShortcuts';
import { useChimeNotifications } from '@/composables/useChimeNotifications';
import { useInitials } from '@/composables/useInitials';
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts';
import { useKeyboardShortcutsModal } from '@/composables/useKeyboardShortcutsModal';
import { useSidebarBadges } from '@/composables/useSidebarBadges';
import { useTeamSwitch } from '@/composables/useTeamSwitch';
import {
    partitionChannels,
    toggleCollapsedSection,
} from '@/lib/channelSections';
import type { SidebarSectionKey } from '@/lib/channelSections';

const page = usePage();

// Chime for qualifying messages across every channel while the workspace is open.
useChimeNotifications();

// Keep the sidebar unread/mention badges live as messages arrive in channels the
// user is a member of but not currently viewing.
useSidebarBadges();

const currentTeam = computed(() => page.props.currentTeam);
const teams = computed(() => page.props.teams ?? []);
const channels = computed(() => page.props.channels ?? []);
const activeChannelSlug = computed(
    () => (page.props.channel as { slug?: string } | undefined)?.slug ?? null,
);
const pendingInvitations = computed(() => page.props.pendingInvitations ?? []);
const hasUnreadThreads = computed(() => page.props.hasUnreadThreads ?? false);

// Split the flat channel list into the pinned "Starred" section and the main
// list, re-derived whenever the shared `channels` prop changes (a star toggle or
// a live badge update).
const sections = computed(() => partitionChannels(channels.value));
const starredChannels = computed(() => sections.value.starred);
const otherChannels = computed(() => sections.value.others);

// Which sidebar sections the user has collapsed, seeded from the shared prop and
// kept in sync when the server recomputes it (e.g. after a reload on another
// device). A local ref lets the header toggle feel instant before the persisted
// state round-trips.
const collapsedSections = ref<string[]>([
    ...(page.props.collapsedChannelSections ?? []),
]);

watch(
    () => page.props.collapsedChannelSections,
    (value) => {
        collapsedSections.value = [...(value ?? [])];
    },
);

function isSectionCollapsed(section: SidebarSectionKey): boolean {
    return collapsedSections.value.includes(section);
}

/**
 * Collapse or expand a sidebar section, persisting the new set so the layout
 * follows the user across reloads and devices. The toggle is optimistic and
 * rolls back if the request fails.
 */
function toggleSection(section: SidebarSectionKey): void {
    const previous = collapsedSections.value;
    const next = toggleCollapsedSection(previous, section);
    collapsedSections.value = next;

    router.patch(
        updateSidebarSections().url,
        { collapsed: next },
        {
            preserveScroll: true,
            preserveState: true,
            only: ['collapsedChannelSections'],
            onError: () => {
                collapsedSections.value = previous;
                toast.error(
                    'Failed to save the sidebar layout. Please try again.',
                );
            },
        },
    );
}

const { getInitials } = useInitials();
const { switchTeam } = useTeamSwitch();

const quickSwitcherOpen = ref(false);
const { isOpen: shortcutsOpen, toggle: toggleShortcuts } =
    useKeyboardShortcutsModal();

/**
 * Jump `delta` channels along the sidebar list from the active one, wrapping at
 * either end. Does nothing until a team and its channels are loaded.
 */
function moveChannel(delta: number): void {
    if (!currentTeam.value) {
        return;
    }

    const slug = adjacentSlug(
        channels.value.map((channel) => channel.slug),
        activeChannelSlug.value,
        delta,
    );

    if (slug) {
        router.visit(show({ team: currentTeam.value.slug, channel: slug }).url);
    }
}

useKeyboardShortcuts({
    'quick-switcher': () =>
        (quickSwitcherOpen.value = !quickSwitcherOpen.value),
    'previous-channel': () => moveChannel(-1),
    'next-channel': () => moveChannel(1),
    'show-shortcuts': () => toggleShortcuts(),
});

onMounted(() => {
    // Lazily pull the (optional) shared invitations so the post-login prompt appears.
    router.reload({ only: ['pendingInvitations'] });
});
</script>

<template>
    <SidebarProvider style="--sidebar-width: calc(3.5rem + 16rem)">
        <Sidebar collapsible="offcanvas" class="overflow-hidden">
            <!-- Nested rail + channel list; a single flex-row wrapper keeps them
                 side by side in both the desktop sidebar and the mobile Sheet. -->
            <div class="flex h-full w-full flex-row">
                <!-- Team rail -->
                <div
                    class="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-sidebar-border bg-sidebar-rail py-3"
                    data-test="team-rail"
                >
                    <div
                        v-for="team in teams"
                        :key="team.id"
                        class="relative flex w-full justify-center"
                    >
                        <span
                            v-if="team.id === currentTeam?.id"
                            aria-hidden="true"
                            class="absolute top-1/2 left-0 h-[22px] w-[3px] -translate-y-1/2 rounded-r-full bg-primary"
                        />
                        <Tooltip>
                            <TooltipTrigger as-child>
                                <button
                                    type="button"
                                    data-test="team-rail-item"
                                    :data-active="team.id === currentTeam?.id"
                                    :aria-current="
                                        team.id === currentTeam?.id
                                            ? 'true'
                                            : undefined
                                    "
                                    class="flex size-9 items-center justify-center rounded-[10px] text-xs font-semibold transition-colors"
                                    :class="
                                        team.id === currentTeam?.id
                                            ? 'bg-primary text-primary-foreground'
                                            : 'border border-border text-muted-foreground hover:bg-sidebar-accent'
                                    "
                                    @click="switchTeam(team)"
                                >
                                    {{ getInitials(team.name) }}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                {{ team.name }}
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    <Separator class="my-1 w-6" />

                    <CreateTeamModal>
                        <button
                            type="button"
                            title="New team"
                            data-test="team-rail-add"
                            class="flex size-9 items-center justify-center rounded-[10px] border border-dashed border-border text-muted-foreground transition-colors hover:bg-sidebar-accent"
                        >
                            <Plus class="size-[15px]" />
                            <span class="sr-only">New team</span>
                        </button>
                    </CreateTeamModal>
                </div>

                <!-- Channel sidebar -->
                <Sidebar collapsible="none" class="flex-1">
                    <SidebarHeader
                        class="h-12 shrink-0 flex-row items-center justify-between border-b border-sidebar-border px-3.5"
                    >
                        <TeamSwitcher />
                    </SidebarHeader>

                    <SidebarContent>
                        <div class="px-2 pt-2">
                            <button
                                type="button"
                                data-test="quick-switcher-trigger"
                                class="flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/40 px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                @click="quickSwitcherOpen = true"
                            >
                                <Search class="size-[15px] shrink-0" />
                                <span>Jump to…</span>
                                <kbd
                                    class="ml-auto rounded border border-sidebar-border bg-sidebar px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-muted-foreground"
                                    >⌘K</kbd
                                >
                            </button>
                        </div>
                        <!-- Starred channels, pinned above the main list; the
                             whole section is hidden until the user stars one. -->
                        <SidebarGroup
                            v-if="starredChannels.length > 0"
                            class="pb-0"
                        >
                            <button
                                type="button"
                                data-test="section-toggle-starred"
                                :aria-expanded="!isSectionCollapsed('starred')"
                                class="flex h-7 w-full items-center gap-1 rounded-md px-2 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase transition-colors hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                                @click="toggleSection('starred')"
                            >
                                <ChevronRight
                                    class="size-3 shrink-0 transition-transform"
                                    :class="
                                        isSectionCollapsed('starred')
                                            ? ''
                                            : 'rotate-90'
                                    "
                                />
                                Starred
                            </button>
                            <SidebarGroupContent
                                v-show="!isSectionCollapsed('starred')"
                                data-test="section-content-starred"
                            >
                                <SidebarMenu>
                                    <ChannelListItem
                                        v-for="channel in starredChannels"
                                        :key="channel.id"
                                        :channel="channel"
                                        :team-slug="currentTeam?.slug ?? ''"
                                        :active-channel-slug="activeChannelSlug"
                                    />
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        <!-- The main channel list. -->
                        <SidebarGroup>
                            <button
                                type="button"
                                data-test="section-toggle-channels"
                                :aria-expanded="!isSectionCollapsed('channels')"
                                class="flex h-7 w-full items-center gap-1 rounded-md px-2 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase transition-colors hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                                @click="toggleSection('channels')"
                            >
                                <ChevronRight
                                    class="size-3 shrink-0 transition-transform"
                                    :class="
                                        isSectionCollapsed('channels')
                                            ? ''
                                            : 'rotate-90'
                                    "
                                />
                                Channels
                            </button>
                            <CreateChannelModal
                                v-if="currentTeam"
                                :team-slug="currentTeam.slug"
                            >
                                <SidebarGroupAction
                                    title="Create channel"
                                    data-test="create-channel-trigger"
                                    class="top-2 size-5 rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                >
                                    <Plus class="size-[13px]" />
                                    <span class="sr-only">Create channel</span>
                                </SidebarGroupAction>
                            </CreateChannelModal>
                            <SidebarGroupContent
                                v-show="!isSectionCollapsed('channels')"
                                data-test="section-content-channels"
                            >
                                <SidebarMenu>
                                    <ChannelListItem
                                        v-for="channel in otherChannels"
                                        :key="channel.id"
                                        :channel="channel"
                                        :team-slug="currentTeam?.slug ?? ''"
                                        :active-channel-slug="activeChannelSlug"
                                    />
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        <!-- Workspace navigation, always visible regardless of
                             which channel sections are collapsed. -->
                        <SidebarGroup class="pt-0">
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            as-child
                                            class="h-[30px] gap-1.5 rounded-md px-2 text-[13px] text-muted-foreground hover:bg-sidebar-accent/60"
                                        >
                                            <Link
                                                v-if="currentTeam"
                                                :href="
                                                    threadsInbox(
                                                        currentTeam.slug,
                                                    ).url
                                                "
                                                data-test="threads-inbox"
                                            >
                                                <MessagesSquare
                                                    class="size-[13px]"
                                                />
                                                <span>Threads</span>
                                                <span
                                                    v-if="hasUnreadThreads"
                                                    data-test="threads-unread-dot"
                                                    aria-hidden="true"
                                                    class="ml-auto size-1.5 rounded-full bg-primary"
                                                />
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            as-child
                                            class="h-[30px] gap-1.5 rounded-md px-2 text-[13px] text-muted-foreground hover:bg-sidebar-accent/60"
                                        >
                                            <Link
                                                v-if="currentTeam"
                                                :href="
                                                    searchMessages(
                                                        currentTeam.slug,
                                                    ).url
                                                "
                                                data-test="search-messages"
                                            >
                                                <MessageSquareText
                                                    class="size-[13px]"
                                                />
                                                <span>Search messages</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            as-child
                                            class="h-[30px] gap-1.5 rounded-md px-2 text-[13px] text-muted-foreground hover:bg-sidebar-accent/60"
                                        >
                                            <Link
                                                v-if="currentTeam"
                                                :href="
                                                    browse(currentTeam.slug).url
                                                "
                                                data-test="browse-channels"
                                            >
                                                <Search class="size-[13px]" />
                                                <span>Browse channels</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>

                    <SidebarFooter class="border-t border-sidebar-border p-2">
                        <NavUser />
                    </SidebarFooter>
                </Sidebar>
            </div>
        </Sidebar>

        <SidebarInset class="flex h-svh flex-col">
            <slot />
        </SidebarInset>

        <PendingInvitationsModal
            v-if="pendingInvitations.length > 0"
            :invitations="pendingInvitations"
        />

        <QuickSwitcher
            v-if="currentTeam"
            v-model:open="quickSwitcherOpen"
            :channels="channels"
            :team-slug="currentTeam.slug"
        />

        <KeyboardShortcutsModal v-model:open="shortcutsOpen" />
    </SidebarProvider>
</template>
