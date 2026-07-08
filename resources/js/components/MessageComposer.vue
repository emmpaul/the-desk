<script setup lang="ts">
import { ArrowUp, Plus } from '@lucide/vue';
import { nextTick, ref } from 'vue';
import { Button } from '@/components/ui/button';

const props = defineProps<{
    channelName: string;
}>();

const emit = defineEmits<{
    send: [body: string];
}>();

const body = ref('');
const textarea = ref<HTMLTextAreaElement | null>(null);

function resize(): void {
    const el = textarea.value;

    if (!el) {
        return;
    }

    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
}

function submit(): void {
    const trimmed = body.value.trim();

    if (trimmed === '') {
        return;
    }

    emit('send', trimmed);
    body.value = '';
    nextTick(resize);
}

function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        submit();
    }
}
</script>

<template>
    <div class="mx-5 mb-4 shrink-0">
        <div
            class="rounded-xl border border-input bg-background p-3 pb-2 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20"
        >
            <textarea
                ref="textarea"
                v-model="body"
                rows="1"
                :placeholder="`Message #${props.channelName}`"
                data-test="message-composer-input"
                class="max-h-[200px] w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
                @input="resize"
                @keydown="onKeydown"
            ></textarea>
            <div class="mt-2.5 flex items-center justify-between">
                <Button
                    variant="outline"
                    size="icon"
                    disabled
                    class="size-[26px] rounded-[7px] text-muted-foreground"
                    aria-label="Add attachment"
                >
                    <Plus class="size-3.5" />
                </Button>
                <Button
                    size="icon"
                    :disabled="body.trim() === ''"
                    data-test="message-composer-send"
                    class="size-7 rounded-lg"
                    aria-label="Send message"
                    @click="submit"
                >
                    <ArrowUp class="size-3.5" />
                </Button>
            </div>
        </div>
    </div>
</template>
