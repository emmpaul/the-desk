<script setup lang="ts">
import { Form } from '@inertiajs/vue3';
import { ref } from 'vue';
import FormField from '@/components/FormField.vue';
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
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { store as storeInvitation } from '@/routes/teams/invitations';
import type { RoleOption, Team } from '@/types';

type Props = {
    team: Team;
    availableRoles: RoleOption[];
    open: boolean;
};

const props = defineProps<Props>();
const emit = defineEmits<{
    'update:open': [value: boolean];
}>();

const inviteRole = ref('member');
const formKey = ref(0);

function handleOpenChange(value: boolean) {
    emit('update:open', value);

    if (!value) {
        inviteRole.value = 'member';
        formKey.value++;
    }
}
</script>

<template>
    <Dialog :open="props.open" @update:open="handleOpenChange">
        <DialogContent>
            <Form
                :key="formKey"
                v-bind="storeInvitation.form(props.team.slug)"
                class="space-y-6"
                v-slot="{ errors, processing }"
                @success="emit('update:open', false)"
            >
                <DialogHeader>
                    <template v-if="props.team.membersCount <= 1">
                        <DialogTitle>{{
                            $t('It’s just you in here')
                        }}</DialogTitle>
                        <DialogDescription>
                            {{
                                $t(
                                    'A workspace comes alive with people. Invite a few teammates to get the conversation going.',
                                )
                            }}
                        </DialogDescription>
                    </template>
                    <template v-else>
                        <DialogTitle>{{
                            $t('Invite a team member')
                        }}</DialogTitle>
                        <DialogDescription>
                            {{ $t('Send an invitation to join this team.') }}
                        </DialogDescription>
                    </template>
                </DialogHeader>

                <div class="grid gap-4">
                    <FormField
                        id="email"
                        :label="$t('Email address')"
                        :error="errors.email"
                        v-slot="{ id }"
                    >
                        <Input
                            :id="id"
                            name="email"
                            data-test="invite-email"
                            type="email"
                            :placeholder="$t('colleague@example.com')"
                            required
                        />
                    </FormField>

                    <FormField
                        id="role"
                        :label="$t('Role')"
                        :error="errors.role"
                        v-slot="{ id }"
                    >
                        <Select
                            v-model="inviteRole"
                            name="role"
                            data-test="invite-role"
                        >
                            <SelectTrigger :id="id" class="w-full">
                                <SelectValue
                                    :placeholder="$t('Select a role')"
                                />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem
                                    v-for="role in props.availableRoles"
                                    :key="role.value"
                                    :value="role.value"
                                >
                                    {{ role.label }}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </FormField>
                </div>

                <DialogFooter class="gap-2">
                    <DialogClose as-child>
                        <Button variant="secondary">
                            {{ $t('Cancel') }}
                        </Button>
                    </DialogClose>

                    <Button
                        type="submit"
                        data-test="invite-submit"
                        :disabled="processing"
                    >
                        {{ $t('Send invitation') }}
                    </Button>
                </DialogFooter>
            </Form>
        </DialogContent>
    </Dialog>
</template>
