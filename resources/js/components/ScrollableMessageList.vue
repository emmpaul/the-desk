<script setup lang="ts">
import { ChevronDown } from '@lucide/vue';
import { computed } from 'vue';

/**
 * The shared scroll surface for the channel timeline and the thread panel: the
 * `overflow-y-auto` container and the floating "jump to latest / N new" pill,
 * which the two used to duplicate verbatim. The pin decision core stays in
 * `useScrollPin` (called by each consumer, which owns how appends reach it); this
 * module owns only the container markup + the pill so both read from one place.
 *
 * The consumer keeps ownership of the scroll element via `register-container` (a
 * function ref) so its existing `useScrollPin` / `useUnreadDivider` / virtualized
 * `MessageList` wiring binds to the very same node. Pin state flows in as props;
 * scroll + jump flow back out as events.
 */
type CommonProps = {
    /** Function ref: receives the scroll element so the consumer's ref points at it. */
    registerContainer: (el: HTMLElement | null) => void;
    /** From the consumer's `useScrollPin`: whether the view is anchored to newest. */
    pinnedToBottom: boolean;
    /** From the consumer's `useScrollPin`: appends seen while scrolled up. */
    newMessageCount: number;
};

/**
 * The channel timeline is a focusable, labelled, virtualized region — so it must
 * name itself; the thread panel is a plain scroller and takes no label.
 */
type Props =
    | (CommonProps & { variant: 'channel'; regionLabel: string })
    | (CommonProps & { variant: 'thread' });

const props = defineProps<Props>();

const emit = defineEmits<{
    /** The container scrolled; the consumer forwards it to `useScrollPin.onScroll`. */
    scroll: [];
    /** The pill was clicked; the consumer forwards it to `scrollToBottom(true)`. */
    jump: [];
}>();

/** The accessible region name, present only for the channel variant. */
const regionAriaLabel = computed(() =>
    props.variant === 'channel' ? props.regionLabel : undefined,
);
</script>

<template>
    <div class="relative flex min-h-0 flex-1 flex-col">
        <div
            :ref="(el) => registerContainer((el as HTMLElement | null) ?? null)"
            :data-test="variant === 'channel' ? 'message-history' : undefined"
            :tabindex="variant === 'channel' ? 0 : undefined"
            :role="variant === 'channel' ? 'region' : undefined"
            :aria-label="regionAriaLabel"
            class="scrollbar-thin min-h-0 flex-1 scrollbar-thumb-border scrollbar-track-transparent overflow-y-auto overscroll-contain"
            :class="
                variant === 'channel'
                    ? 'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset'
                    : ''
            "
            @scroll.passive="emit('scroll')"
        >
            <slot />
        </div>

        <!-- Channel timeline pill: text label + "Jump to present" fallback. -->
        <Transition
            v-if="variant === 'channel'"
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="translate-y-3 scale-95 opacity-0"
            enter-to-class="translate-y-0 scale-100 opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="translate-y-0 scale-100 opacity-100"
            leave-to-class="translate-y-3 scale-95 opacity-0"
        >
            <!-- eslint-disable-next-line local/no-raw-button -- bespoke jump-to-latest pill -->
            <button
                v-if="!pinnedToBottom"
                type="button"
                data-test="jump-to-latest"
                :data-new-count="newMessageCount"
                :aria-label="
                    newMessageCount > 0
                        ? $t(':count new messages, jump to latest', {
                              count: newMessageCount,
                          })
                        : $t('Jump to latest message')
                "
                class="absolute right-4 bottom-4 z-10 inline-flex h-9.5 items-center gap-2 rounded-full px-4.5 text-[12.5px] font-semibold shadow-lg transition-colors hover:opacity-90"
                :class="
                    newMessageCount > 0
                        ? 'bg-brass text-brass-foreground'
                        : 'bg-foreground text-background'
                "
                @click="emit('jump')"
            >
                <span v-if="newMessageCount > 0">
                    {{
                        newMessageCount === 1
                            ? $t(':count new message', {
                                  count: newMessageCount,
                              })
                            : $t(':count new messages', {
                                  count: newMessageCount,
                              })
                    }}
                </span>
                <span v-else>{{ $t('Jump to present') }}</span>
                <ChevronDown
                    class="size-3.25 shrink-0"
                    :class="newMessageCount > 0 ? '' : 'text-brass'"
                />
            </button>
        </Transition>

        <!-- Thread pill: icon-only at rest, "N new replies" while scrolled up. -->
        <Transition
            v-else
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="translate-y-1 opacity-0"
            enter-to-class="translate-y-0 opacity-100"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="translate-y-0 opacity-100"
            leave-to-class="translate-y-1 opacity-0"
        >
            <!-- eslint-disable-next-line local/no-raw-button -- bespoke jump-to-latest pill -->
            <button
                v-if="!pinnedToBottom"
                type="button"
                data-test="jump-to-latest-thread"
                :data-new-count="newMessageCount"
                :aria-label="
                    newMessageCount > 0
                        ? $t(':count new replies, jump to latest', {
                              count: newMessageCount,
                          })
                        : $t('Jump to latest reply')
                "
                class="absolute right-4 bottom-4 z-10 inline-flex items-center gap-1.5 rounded-full shadow-md transition-colors"
                :class="
                    newMessageCount > 0
                        ? 'bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground hover:opacity-90'
                        : 'size-9 justify-center bg-card text-muted-foreground ring-1 ring-border hover:bg-muted hover:text-foreground'
                "
                @click="emit('jump')"
            >
                <ChevronDown class="size-4 shrink-0" />
                <span v-if="newMessageCount > 0">
                    {{
                        newMessageCount === 1
                            ? $t(':count new reply', { count: newMessageCount })
                            : $t(':count new replies', {
                                  count: newMessageCount,
                              })
                    }}
                </span>
            </button>
        </Transition>
    </div>
</template>
