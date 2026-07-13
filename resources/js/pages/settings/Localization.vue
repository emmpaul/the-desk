<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import { ref } from 'vue';
import FormField from '@/components/FormField.vue';
import SettingsSection from '@/components/SettingsSection.vue';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useLocale } from '@/composables/useLocale';
import { translate } from '@/lib/i18n';
import { edit } from '@/routes/locale';
import type { AppLocale, LocaleOption } from '@/types';

defineProps<{
    locales: LocaleOption[];
}>();

defineOptions({
    layout: {
        breadcrumbs: [
            {
                title: translate('Language & region'),
                href: edit(),
            },
        ],
    },
});

const { locale, updateLocale } = useLocale();

const selected = ref<AppLocale>(locale.value);

function onSelect(value: unknown): void {
    if (typeof value !== 'string') {
        return;
    }

    selected.value = value as AppLocale;
    void updateLocale(selected.value);
}
</script>

<template>
    <Head :title="$t('Language & region')" />

    <h1 class="sr-only">{{ $t('Language & region') }}</h1>

    <SettingsSection
        :title="$t('Language')"
        :description="
            $t('Choose the language used across your workspace interface.')
        "
    >
        <FormField
            id="locale"
            :label="$t('Display language')"
            :hint="
                $t(
                    'Dates, times, and numbers are formatted to match your selected language.',
                )
            "
            v-slot="{ id }"
        >
            <Select :model-value="selected" @update:model-value="onSelect">
                <SelectTrigger :id="id" class="w-full">
                    <SelectValue :placeholder="$t('Select a language')" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem
                        v-for="option in locales"
                        :key="option.value"
                        :value="option.value"
                    >
                        {{ option.label }}
                    </SelectItem>
                </SelectContent>
            </Select>
        </FormField>
    </SettingsSection>
</template>
