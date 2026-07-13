<script setup lang="ts">
import { Form } from '@inertiajs/vue3';
import { ref, useTemplateRef } from 'vue';
import FormField from '@/components/FormField.vue';
import PasswordInput from '@/components/PasswordInput.vue';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { transferOwnership } from '@/routes/teams/members';
import type { Team, TeamMember } from '@/types';

type Props = {
    team: Team;
    member: TeamMember | null;
    open: boolean;
};

const props = defineProps<Props>();
const emit = defineEmits<{
    'update:open': [value: boolean];
}>();

const passwordInput = useTemplateRef('passwordInput');
const formKey = ref(0);

const handleOpenChange = (nextOpen: boolean) => {
    emit('update:open', nextOpen);

    if (!nextOpen) {
        formKey.value++;
    }
};
</script>

<template>
    <Dialog :open="props.open" @update:open="handleOpenChange">
        <DialogContent>
            <Form
                v-if="props.member"
                :key="formKey"
                v-bind="
                    transferOwnership.form([props.team.slug, props.member.id])
                "
                reset-on-success
                @error="() => passwordInput?.focus()"
                @success="handleOpenChange(false)"
                :options="{ preserveScroll: true }"
                class="space-y-6"
                v-slot="{ errors, processing }"
            >
                <DialogHeader class="space-y-3">
                    <DialogTitle>{{
                        $t('Transfer team ownership')
                    }}</DialogTitle>
                    <DialogDescription>
                        {{
                            $t('Ownership of this team will be transferred to')
                        }}
                        <strong>{{ props.member.name }}</strong
                        >.
                        {{
                            $t(
                                'You will be demoted to Admin and can no longer manage ownership. Enter your password to confirm.',
                            )
                        }}
                    </DialogDescription>
                </DialogHeader>

                <FormField
                    id="transfer-password"
                    :label="$t('Password')"
                    label-class="sr-only"
                    :error="errors.password"
                    v-slot="{ id }"
                >
                    <PasswordInput
                        :id="id"
                        name="password"
                        ref="passwordInput"
                        data-test="transfer-ownership-password"
                        :placeholder="$t('Password')"
                    />
                </FormField>

                <DialogFooter class="gap-2">
                    <DialogClose as-child>
                        <Button variant="secondary">
                            {{ $t('Cancel') }}
                        </Button>
                    </DialogClose>

                    <Button
                        type="submit"
                        data-test="transfer-ownership-confirm"
                        :disabled="processing"
                    >
                        {{ $t('Transfer ownership') }}
                    </Button>
                </DialogFooter>
            </Form>
        </DialogContent>
    </Dialog>
</template>
