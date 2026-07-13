<script setup lang="ts">
import { Form, Head } from '@inertiajs/vue3';
import { ref } from 'vue';
import FormField from '@/components/FormField.vue';
import PasswordInput from '@/components/PasswordInput.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { translate } from '@/lib/i18n';
import { update } from '@/routes/password';

defineOptions({
    layout: {
        title: translate('Reset password'),
        description: translate('Please enter your new password below'),
    },
});

const props = defineProps<{
    token: string;
    email: string;
    passwordRules: string;
}>();

const inputEmail = ref(props.email);
</script>

<template>
    <Head :title="$t('Reset password')" />

    <Form
        v-bind="update.form()"
        :transform="(data) => ({ ...data, token, email })"
        :reset-on-success="['password', 'password_confirmation']"
        v-slot="{ errors, processing }"
    >
        <div class="grid gap-6">
            <FormField
                id="email"
                :label="$t('Email')"
                :error="errors.email"
                v-slot="{ id }"
            >
                <Input
                    :id="id"
                    type="email"
                    name="email"
                    autocomplete="email"
                    v-model="inputEmail"
                    readonly
                />
            </FormField>

            <FormField
                id="password"
                :label="$t('Password')"
                :error="errors.password"
                v-slot="{ id }"
            >
                <PasswordInput
                    :id="id"
                    name="password"
                    autocomplete="new-password"
                    autofocus
                    :placeholder="$t('Password')"
                    :passwordrules="passwordRules"
                />
            </FormField>

            <FormField
                id="password_confirmation"
                :label="$t('Confirm password')"
                :error="errors.password_confirmation"
                v-slot="{ id }"
            >
                <PasswordInput
                    :id="id"
                    name="password_confirmation"
                    autocomplete="new-password"
                    :placeholder="$t('Confirm password')"
                    :passwordrules="passwordRules"
                />
            </FormField>

            <Button
                type="submit"
                class="mt-4 w-full rounded-full"
                :loading="processing"
                data-test="reset-password-button"
            >
                {{ $t('Reset password') }}
            </Button>
        </div>
    </Form>
</template>
