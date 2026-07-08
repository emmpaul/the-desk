<script setup lang="ts">
import { computed } from 'vue';
import { useInitials } from '@/composables/useInitials';
import { renderMessageBody } from '@/lib/messageBody';
import type { Message, MessageAuthor } from '@/types';

const props = defineProps<{
    messages: Message[];
    pendingUuids?: string[];
}>();

const { getInitials } = useInitials();

// Consecutive messages from the same author within this window are grouped
// under a single avatar + header line.
const GROUPING_WINDOW_MS = 5 * 60 * 1000;

type RenderGroup = {
    type: 'group';
    key: string;
    author: MessageAuthor;
    leadCreatedAt: string;
    messages: Message[];
};

type RenderDivider = {
    type: 'divider';
    key: string;
    label: string;
};

type RenderItem = RenderGroup | RenderDivider;

function dayKey(iso: string): string {
    return new Date(iso).toDateString();
}

function dividerLabel(iso: string): string {
    const date = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (dayKey(iso) === today.toDateString()) {
        return 'Today';
    }

    if (dayKey(iso) === yesterday.toDateString()) {
        return 'Yesterday';
    }

    return date.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year:
            date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
    });
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
    });
}

const renderItems = computed<RenderItem[]>(() => {
    const items: RenderItem[] = [];
    let currentGroup: RenderGroup | null = null;
    let currentDay: string | null = null;
    let lastCreatedAt: string | null = null;

    for (const message of props.messages) {
        const messageDay = dayKey(message.createdAt);
        const startsNewDay = messageDay !== currentDay;

        if (startsNewDay) {
            items.push({
                type: 'divider',
                key: `divider-${messageDay}`,
                label: dividerLabel(message.createdAt),
            });
            currentDay = messageDay;
        }

        const sameAuthor = currentGroup?.author.id === message.user.id;
        const withinWindow =
            lastCreatedAt !== null &&
            new Date(message.createdAt).getTime() -
                new Date(lastCreatedAt).getTime() <=
                GROUPING_WINDOW_MS;

        if (!currentGroup || startsNewDay || !sameAuthor || !withinWindow) {
            currentGroup = {
                type: 'group',
                key: `group-${message.id}`,
                author: message.user,
                leadCreatedAt: message.createdAt,
                messages: [message],
            };
            items.push(currentGroup);
        } else {
            currentGroup.messages.push(message);
        }

        lastCreatedAt = message.createdAt;
    }

    return items;
});

const pending = computed(() => new Set(props.pendingUuids ?? []));

function isPending(message: Message): boolean {
    return pending.value.has(message.clientUuid);
}
</script>

<template>
    <div class="px-5 pt-4 pb-2">
        <template v-for="item in renderItems" :key="item.key">
            <div
                v-if="item.type === 'divider'"
                class="relative my-4 flex items-center justify-center"
            >
                <span
                    aria-hidden="true"
                    class="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border"
                />
                <span
                    class="relative rounded-full border border-border bg-background px-3 py-0.5 text-[11.5px] font-medium text-muted-foreground"
                >
                    {{ item.label }}
                </span>
            </div>

            <div v-else class="mt-[18px] flex gap-3 first:mt-1">
                <div
                    class="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-[12px] font-semibold text-primary select-none"
                    aria-hidden="true"
                >
                    {{ getInitials(item.author.name) }}
                </div>
                <div class="min-w-0 flex-1">
                    <div class="flex items-baseline gap-2">
                        <span
                            class="text-[14.5px] font-semibold text-foreground"
                            >{{ item.author.name }}</span
                        >
                        <span class="text-[11px] text-muted-foreground/80">{{
                            formatTime(item.leadCreatedAt)
                        }}</span>
                    </div>
                    <p
                        v-for="(message, index) in item.messages"
                        :key="message.id"
                        :data-test="'message-body'"
                        class="text-[14.5px] leading-[1.55] break-words whitespace-pre-wrap text-foreground/90"
                        :class="[
                            index === 0 ? 'mt-0.5' : 'mt-1.5',
                            isPending(message) ? 'opacity-60' : '',
                        ]"
                        v-html="renderMessageBody(message.body)"
                    ></p>
                </div>
            </div>
        </template>
    </div>
</template>
