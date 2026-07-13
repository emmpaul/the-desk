<script setup lang="ts">
import { Form, Head } from '@inertiajs/vue3';
import FormField from '@/components/FormField.vue';
import PasswordInput from '@/components/PasswordInput.vue';
import TeamInvitationAlert from '@/components/TeamInvitationAlert.vue';
import TextLink from '@/components/TextLink.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { translate } from '@/lib/i18n';
import { login } from '@/routes';
import { store } from '@/routes/register';
import type { TeamInvitationContext } from '@/types';

defineProps<{
    passwordRules: string;
    teamInvitation?: TeamInvitationContext | null;
}>();

defineOptions({
    layout: {
        title: translate('Create an account'),
        description: translate(
            'Enter your details below to create your account',
        ),
    },
});
</script>

<template>
    <Head :title="$t('Register')" />

    <div class="flex flex-col gap-5">
        <TeamInvitationAlert
            v-if="teamInvitation"
            :invitation="teamInvitation"
            action="Register"
        />

        <Form
            v-bind="store.form()"
            :reset-on-success="['password', 'password_confirmation']"
            v-slot="{ errors, processing }"
            class="flex flex-col gap-6"
        >
            <div class="grid gap-6">
                <FormField
                    id="name"
                    :label="$t('Name')"
                    :error="errors.name"
                    v-slot="{ id }"
                >
                    <Input
                        :id="id"
                        type="text"
                        required
                        autofocus
                        :tabindex="1"
                        autocomplete="name"
                        name="name"
                        :placeholder="$t('Full name')"
                    />
                </FormField>

                <FormField
                    id="email"
                    :label="$t('Email address')"
                    :error="errors.email"
                    v-slot="{ id }"
                >
                    <Input
                        :id="id"
                        type="email"
                        required
                        :tabindex="2"
                        autocomplete="email"
                        name="email"
                        placeholder="email@example.com"
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
                        required
                        :tabindex="3"
                        autocomplete="new-password"
                        name="password"
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
                        required
                        :tabindex="4"
                        autocomplete="new-password"
                        name="password_confirmation"
                        :placeholder="$t('Confirm password')"
                        :passwordrules="passwordRules"
                    />
                </FormField>

                <Button
                    type="submit"
                    class="mt-2 w-full rounded-full"
                    tabindex="5"
                    :loading="processing"
                    data-test="register-user-button"
                >
                    {{ $t('Create account') }}
                </Button>
            </div>

            <div class="text-center text-sm text-muted-foreground">
                {{ $t('Already have an account?') }}
                <TextLink
                    :href="
                        teamInvitation
                            ? login.url({
                                  query: {
                                      invitation: teamInvitation.code,
                                  },
                              })
                            : login()
                    "
                    class="underline underline-offset-4"
                    :tabindex="6"
                    data-test="team-invitation-login-link"
                >
                    {{ $t('Log in') }}
                </TextLink>
            </div>
        </Form>
    </div>
</template>
