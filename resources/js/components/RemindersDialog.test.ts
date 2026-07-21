import { describe, expect, it, vi } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import type { MessageReminder } from '@/types';

/**
 * The dialog chrome is stubbed away so the list rows render inline: reka's
 * `DialogContent` teleports and never reaches the SSR string otherwise.
 * `stub(tag)` builds a passthrough component; hoisted so the vi.mock factories
 * (which run before the module body) can reach it.
 */
const { stub } = await vi.hoisted(async () => {
    const { defineComponent, h: hyper } = await import('vue');

    return {
        stub: (tag: string) =>
            defineComponent({
                setup:
                    (_: unknown, ctx: { slots: { default?: () => unknown } }) =>
                    () =>
                        hyper(tag, ctx.slots.default?.() as never),
            }),
    };
});

vi.mock('@/components/ui/dialog', () => ({
    Dialog: stub('div'),
    DialogContent: stub('div'),
    DialogDescription: stub('p'),
    DialogHeader: stub('div'),
    DialogTitle: stub('h2'),
}));

import RemindersDialog from './RemindersDialog.vue';

function reminder(overrides: Partial<MessageReminder> = {}): MessageReminder {
    return {
        id: 'rem-1',
        messageId: 'msg-1',
        remindAt: '2030-01-01T10:00:00+00:00',
        teamSlug: 'acme',
        channelSlug: 'war-room',
        channelName: 'war-room',
        authorName: 'Jordan West',
        body: 'the secret plan',
        isDeleted: false,
        isAccessible: true,
        ...overrides,
    };
}

async function render(
    overrides: Partial<MessageReminder> = {},
): Promise<string> {
    const app = createSSRApp({
        render: () =>
            h(RemindersDialog, {
                reminders: [reminder(overrides)],
                timezone: 'UTC',
                open: true,
            }),
    });

    app.config.globalProperties.$t = (key: string) => key;

    return renderToString(app);
}

describe('RemindersDialog inaccessible rows', () => {
    it('renders a redacted row with no jump control once the channel is out of reach', async () => {
        const html = await render({
            isAccessible: false,
            body: '',
            authorName: '',
            channelName: null,
            channelSlug: '',
        });

        expect(html).toContain('data-test="reminder-unavailable"');
        expect(html).not.toContain('data-test="reminder-open"');
        expect(html).toContain('You no longer have access to this channel.');
        expect(html).toContain('No longer available');
        // The clear control survives: the owner can still get rid of the row.
        expect(html).toContain('data-test="reminder-clear"');
    });

    it('keeps the jump control and the quote for a row still in reach', async () => {
        const html = await render();

        expect(html).toContain('data-test="reminder-open"');
        expect(html).not.toContain('data-test="reminder-unavailable"');
        expect(html).toContain('the secret plan');
        expect(html).toContain('Jordan West');
    });
});
