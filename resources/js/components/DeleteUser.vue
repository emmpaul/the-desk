<script setup lang="ts">
import { Form } from '@inertiajs/vue3';
import { useTemplateRef } from 'vue';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
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
    DialogTrigger,
} from '@/components/ui/dialog';

const passwordInput = useTemplateRef('passwordInput');
</script>

<template>
    <div>
        <Dialog>
            <DialogTrigger as-child>
                <Button
                    variant="outline"
                    class="rounded-full border-destructive/40 text-destructive hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive"
                    data-test="delete-user-button"
                    >{{ $t('Delete account…') }}</Button
                >
            </DialogTrigger>
            <DialogContent>
                <Form
                    v-bind="ProfileController.destroy.form()"
                    reset-on-success
                    @error="() => passwordInput?.focus()"
                    :options="{
                        preserveScroll: true,
                    }"
                    class="space-y-6"
                    v-slot="{ errors, processing, reset, clearErrors }"
                >
                    <DialogHeader class="space-y-3">
                        <DialogTitle>{{
                            $t('Are you sure you want to delete your account?')
                        }}</DialogTitle>
                        <DialogDescription>
                            {{
                                $t(
                                    'Once your account is deleted, all of its resources and data will also be permanently deleted. Please enter your password to confirm you would like to permanently delete your account.',
                                )
                            }}
                        </DialogDescription>
                    </DialogHeader>

                    <FormField
                        id="password"
                        :label="$t('Password')"
                        label-class="sr-only"
                        :error="errors.password"
                        v-slot="{ id }"
                    >
                        <PasswordInput
                            :id="id"
                            name="password"
                            ref="passwordInput"
                            :placeholder="$t('Password')"
                        />
                    </FormField>

                    <DialogFooter class="gap-2">
                        <DialogClose as-child>
                            <Button
                                variant="secondary"
                                @click="
                                    () => {
                                        clearErrors();
                                        reset();
                                    }
                                "
                            >
                                {{ $t('Cancel') }}
                            </Button>
                        </DialogClose>

                        <Button
                            type="submit"
                            variant="destructive"
                            :disabled="processing"
                            data-test="confirm-delete-user-button"
                        >
                            {{ $t('Delete account') }}
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    </div>
</template>
