<script setup lang="ts">
import { Form, Head } from '@inertiajs/vue3';
import FormField from '@/components/FormField.vue';
import PasswordInput from '@/components/PasswordInput.vue';
import { Button } from '@/components/ui/button';
import { translate } from '@/lib/i18n';
import { store } from '@/routes/password/confirm';

defineOptions({
    layout: {
        title: translate('Confirm password'),
        description: translate(
            'This is a secure area of the application. Please confirm your password before continuing.',
        ),
        icon: 'lock',
    },
});
</script>

<template>
    <Head :title="$t('Confirm password')" />

    <Form
        v-bind="store.form()"
        reset-on-success
        v-slot="{ errors, processing }"
    >
        <div class="space-y-6">
            <FormField
                id="password"
                :label="$t('Password')"
                :error="errors.password"
                v-slot="{ id }"
            >
                <PasswordInput
                    :id="id"
                    name="password"
                    required
                    autocomplete="current-password"
                    autofocus
                />
            </FormField>

            <div class="flex items-center">
                <Button
                    class="w-full rounded-full"
                    :loading="processing"
                    data-test="confirm-password-button"
                >
                    {{ $t('Confirm password') }}
                </Button>
            </div>
        </div>
    </Form>
</template>
