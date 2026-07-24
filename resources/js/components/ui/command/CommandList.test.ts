// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { App } from 'vue';
import { createApp, defineComponent, h, nextTick } from 'vue';

import { Command, CommandList } from '@/components/ui/command';

let app: App | null = null;

/**
 * Mounts a real `<Command>`/`<CommandList>` pair under jsdom and returns the
 * element reka renders with `role="listbox"`, so the tests read the accessible
 * name exactly where axe audits it.
 */
async function mount(ariaLabel: string): Promise<HTMLElement> {
    app = createApp(
        defineComponent({
            setup: () => () =>
                h(Command, () => [h(CommandList, { ariaLabel }, () => [])]),
        }),
    );
    app.mount(document.body.appendChild(document.createElement('div')));

    await nextTick();

    const listbox = document.querySelector<HTMLElement>('[role="listbox"]');

    expect(listbox).not.toBeNull();

    return listbox as HTMLElement;
}

afterEach(() => {
    app?.unmount();
    app = null;
    document.body.innerHTML = '';
});

describe('CommandList', () => {
    it('names the listbox with the required aria-label, where axe audits it (#798)', async () => {
        const listbox = await mount('People');

        expect(listbox.getAttribute('aria-label')).toBe('People');
        expect(listbox.getAttribute('data-slot')).toBe('command-list');
    });
});
