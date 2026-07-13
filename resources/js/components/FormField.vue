<script setup lang="ts">
import { useId } from 'vue';
import InputError from '@/components/InputError.vue';
import { Label } from '@/components/ui/label';

/**
 * The single place a form field's shape is decided: the `grid gap-2` wrapper,
 * the `<Label :for>` binding, the `<InputError>` placement, and an optional
 * hint line. The control lives in the default slot and receives the field `id`
 * via slot scope, so the label/control coupling is wired from one source and
 * cannot drift.
 */
const props = defineProps<{
    label?: string;
    id?: string;
    error?: string;
    hint?: string;
    labelClass?: string;
}>();

const fieldId = props.id ?? useId();
</script>

<template>
    <div class="grid gap-2">
        <div
            v-if="$slots.labelAction"
            class="flex items-center justify-between"
        >
            <Label :for="fieldId" :class="labelClass">
                <slot name="label">{{ label }}</slot>
            </Label>
            <slot name="labelAction" />
        </div>
        <Label v-else :for="fieldId" :class="labelClass">
            <slot name="label">{{ label }}</slot>
        </Label>

        <slot :id="fieldId" />

        <InputError :message="error" />

        <p v-if="hint" class="text-sm text-muted-foreground">{{ hint }}</p>
    </div>
</template>
