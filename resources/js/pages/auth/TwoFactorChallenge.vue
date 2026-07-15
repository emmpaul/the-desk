<script setup lang="ts">
import { Form, Head } from '@inertiajs/vue3';
import { ref } from 'vue';
import AuthStatus from '@/components/AuthStatus.vue';
import FormField from '@/components/FormField.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { translate } from '@/lib/i18n';
import { store } from '@/routes/two-factor/login';

defineOptions({
    layout: {
        title: translate('Two-factor authentication'),
        description: translate(
            'Confirm access to your account by entering the code from your authenticator application.',
        ),
        icon: 'lock',
    },
});

defineProps<{
    status?: string;
}>();

const useRecoveryCode = ref(false);

function toggleRecoveryCode(): void {
    useRecoveryCode.value = !useRecoveryCode.value;
}
</script>

<template>
    <Head :title="$t('Two-factor authentication')" />

    <AuthStatus v-if="status" class="mb-6">{{ status }}</AuthStatus>

    <Form
        v-bind="store.form()"
        reset-on-success
        v-slot="{ errors, processing }"
    >
        <div class="space-y-6">
            <template v-if="!useRecoveryCode">
                <FormField
                    id="code"
                    :label="$t('Authentication code')"
                    :error="errors.code"
                    v-slot="{ id }"
                >
                    <Input
                        :id="id"
                        name="code"
                        type="text"
                        inputmode="numeric"
                        autocomplete="one-time-code"
                        autofocus
                        :placeholder="$t('123456')"
                    />
                </FormField>
            </template>

            <template v-else>
                <FormField
                    id="recovery_code"
                    :label="$t('Recovery code')"
                    :error="errors.recovery_code"
                    v-slot="{ id }"
                >
                    <Input
                        :id="id"
                        name="recovery_code"
                        type="text"
                        autocomplete="one-time-code"
                        autofocus
                    />
                </FormField>
            </template>

            <Button
                class="w-full rounded-full"
                :loading="processing"
                data-test="two-factor-challenge-button"
            >
                {{ $t('Continue') }}
            </Button>

            <div class="text-center text-sm">
                <Button
                    type="button"
                    variant="link"
                    class="text-muted-foreground"
                    data-test="toggle-recovery-code"
                    @click="toggleRecoveryCode"
                >
                    <template v-if="!useRecoveryCode">
                        {{ $t('Use a recovery code') }}
                    </template>
                    <template v-else>
                        {{ $t('Use an authentication code') }}
                    </template>
                </Button>
            </div>
        </div>
    </Form>
</template>
