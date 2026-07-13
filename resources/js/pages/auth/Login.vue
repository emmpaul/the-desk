<script setup lang="ts">
import { Form, Head } from '@inertiajs/vue3';
import AuthStatus from '@/components/AuthStatus.vue';
import FormField from '@/components/FormField.vue';
import PasswordInput from '@/components/PasswordInput.vue';
import TeamInvitationAlert from '@/components/TeamInvitationAlert.vue';
import TextLink from '@/components/TextLink.vue';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { translate } from '@/lib/i18n';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import type { TeamInvitationContext } from '@/types';

defineOptions({
    layout: {
        title: translate('Log in to your account'),
        description: translate('Enter your email and password below to log in'),
    },
});

defineProps<{
    status?: string;
    canResetPassword: boolean;
    teamInvitation?: TeamInvitationContext | null;
}>();
</script>

<template>
    <Head :title="$t('Log in')" />

    <div class="flex flex-col gap-5">
        <AuthStatus v-if="status">{{ status }}</AuthStatus>

        <TeamInvitationAlert
            v-if="teamInvitation"
            :invitation="teamInvitation"
            action="Log in"
        />

        <Form
            v-bind="store.form()"
            :reset-on-success="['password']"
            v-slot="{ errors, processing }"
            class="flex flex-col gap-6"
        >
            <div class="grid gap-6">
                <FormField
                    id="email"
                    :label="$t('Email address')"
                    :error="errors.email"
                    v-slot="{ id }"
                >
                    <Input
                        :id="id"
                        type="email"
                        name="email"
                        required
                        autofocus
                        :tabindex="1"
                        autocomplete="email"
                        placeholder="email@example.com"
                    />
                </FormField>

                <FormField
                    id="password"
                    :label="$t('Password')"
                    :error="errors.password"
                >
                    <template #labelAction>
                        <TextLink
                            v-if="canResetPassword"
                            :href="request()"
                            class="text-sm"
                            :tabindex="5"
                        >
                            {{ $t('Forgot password?') }}
                        </TextLink>
                    </template>
                    <template #default="{ id }">
                        <PasswordInput
                            :id="id"
                            name="password"
                            required
                            :tabindex="2"
                            autocomplete="current-password"
                            :placeholder="$t('Password')"
                        />
                    </template>
                </FormField>

                <div class="flex items-center justify-between">
                    <Label for="remember" class="flex items-center space-x-3">
                        <Checkbox id="remember" name="remember" :tabindex="3" />
                        <span>{{ $t('Remember me') }}</span>
                    </Label>
                </div>

                <Button
                    type="submit"
                    class="mt-4 w-full rounded-full"
                    :tabindex="4"
                    :loading="processing"
                    data-test="login-button"
                >
                    {{ $t('Log in') }}
                </Button>
            </div>

            <div
                v-if="$page.props.registrationEnabled"
                class="text-center text-sm text-muted-foreground"
            >
                {{ $t("Don't have an account?") }}
                <TextLink
                    :href="
                        register({
                            query: {
                                invitation: teamInvitation?.code,
                            },
                        })
                    "
                    :tabindex="5"
                    data-test="register-link"
                >
                    {{ $t('Sign up') }}
                </TextLink>
            </div>
        </Form>
    </div>
</template>
