<script setup lang="ts">
import { Head, InfiniteScroll, router, usePage } from '@inertiajs/vue3';
import { computed, ref, watch } from 'vue';
import { store as storeMessage } from '@/actions/App/Http/Controllers/Channels/MessageController';
import MessageComposer from '@/components/MessageComposer.vue';
import MessageList from '@/components/MessageList.vue';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { Channel, Message, MessagePage } from '@/types';

const props = defineProps<{
    team: { id: string; name: string; slug: string };
    channel: Channel;
    messages: MessagePage;
}>();

const page = usePage();

const currentUser = computed(() => ({
    id: String(page.props.auth.user.id),
    name: page.props.auth.user.name,
}));

// Optimistically-rendered messages awaiting their server echo. Keyed by the
// client uuid the server persists, so the reload after a successful post
// replaces them with the canonical row.
const pending = ref<Message[]>([]);

// `Inertia::scroll` delivers messages newest-first; reverse for display.
const serverMessages = computed<Message[]>(() =>
    [...(props.messages?.data ?? [])].reverse(),
);

const displayMessages = computed<Message[]>(() => {
    const serverUuids = new Set(
        serverMessages.value.map((message) => message.clientUuid),
    );

    return [
        ...serverMessages.value,
        ...pending.value.filter(
            (message) => !serverUuids.has(message.clientUuid),
        ),
    ];
});

const pendingUuids = computed(() =>
    pending.value.map((message) => message.clientUuid),
);

const hasMessages = computed(() => displayMessages.value.length > 0);

// Drop optimistic messages once the server confirms them.
watch(serverMessages, (messages) => {
    const serverUuids = new Set(messages.map((message) => message.clientUuid));
    pending.value = pending.value.filter(
        (message) => !serverUuids.has(message.clientUuid),
    );
});

function send(body: string): void {
    const clientUuid = crypto.randomUUID();

    pending.value.push({
        id: clientUuid,
        clientUuid,
        body,
        user: currentUser.value,
        createdAt: new Date().toISOString(),
        editedAt: null,
    });

    router.post(
        storeMessage({ team: props.team.slug, channel: props.channel.slug })
            .url,
        { body, client_uuid: clientUuid },
        {
            preserveScroll: true,
            onError: () => {
                // The optimistic row failed to persist; roll it back.
                pending.value = pending.value.filter(
                    (message) => message.clientUuid !== clientUuid,
                );
            },
        },
    );
}
</script>

<template>
    <Head :title="`#${props.channel.name}`" />

    <header
        class="flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-5"
    >
        <SidebarTrigger
            class="-ml-1.5 size-8 text-muted-foreground md:hidden"
        />
        <h1 class="text-[15px] font-semibold text-foreground">
            <span class="mr-0.5 font-medium text-muted-foreground/70">#</span
            >{{ props.channel.name }}
        </h1>
        <template v-if="props.channel.topic">
            <Separator orientation="vertical" class="h-4" />
            <p class="min-w-0 truncate text-[13px] text-muted-foreground">
                {{ props.channel.topic }}
            </p>
        </template>
    </header>

    <div class="flex min-h-0 flex-1 flex-col">
        <div class="min-h-0 flex-1 overflow-y-auto">
            <InfiniteScroll
                v-if="hasMessages"
                data="messages"
                reverse
                preserve-url
            >
                <MessageList
                    :messages="displayMessages"
                    :pending-uuids="pendingUuids"
                />
            </InfiniteScroll>

            <div
                v-else
                class="flex h-full flex-col items-center justify-center gap-1"
            >
                <div
                    class="flex size-14 items-center justify-center rounded-2xl border border-border bg-muted text-2xl font-semibold text-muted-foreground"
                    aria-hidden="true"
                >
                    #
                </div>
                <p class="mt-2.5 text-[15px] font-semibold text-foreground">
                    No messages yet
                </p>
                <p class="text-[13.5px] text-muted-foreground">
                    Be the first to say something in #{{ props.channel.name }}.
                </p>
            </div>
        </div>

        <MessageComposer :channel-name="props.channel.name" @send="send" />
    </div>
</template>
