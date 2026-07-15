// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { App, Component } from 'vue';
import { createApp, defineComponent, h } from 'vue';
import ScrollableMessageList from './ScrollableMessageList.vue';

/**
 * Mounts `<ScrollableMessageList>` under jsdom so the presentational contract is
 * exercised for real: the variant-specific container a11y and pill markup, the
 * `register-container` function ref handing the scroll element back to the
 * consumer, and the `scroll` / `jump` events the consumer forwards to
 * `useScrollPin`. `$t` echoes its key so labels resolve without locale plumbing.
 */
let active: Array<{ app: App; container: HTMLElement }> = [];

function mount(props: Record<string, unknown>) {
    const scroll = vi.fn();
    const jump = vi.fn();
    const container = document.createElement('div');
    document.body.appendChild(container);

    const vnodeProps: Record<string, unknown> = {
        ...props,
        onScroll: scroll,
        onJump: jump,
    };
    const app = createApp(
        defineComponent({
            setup() {
                return () =>
                    h(ScrollableMessageList as Component, vnodeProps, {
                        default: () => h('p', { 'data-test': 'rows' }, 'rows'),
                    });
            },
        }),
    );
    app.config.globalProperties.$t = (key: string) => key;
    app.mount(container);
    active.push({ app, container });

    const scrollEl = container.querySelector<HTMLElement>(
        '.overflow-y-auto',
    ) as HTMLElement;
    const pill = () =>
        container.querySelector<HTMLButtonElement>(
            '[data-test^="jump-to-latest"]',
        );

    return { container, scroll, jump, scrollEl, pill };
}

afterEach(() => {
    for (const { app, container } of active) {
        app.unmount();
        container.remove();
    }

    active = [];
});

const channelBase = {
    variant: 'channel',
    regionLabel: 'Message history',
    pinnedToBottom: false,
    newMessageCount: 0,
};

const threadBase = {
    variant: 'thread',
    pinnedToBottom: false,
    newMessageCount: 0,
};

describe('ScrollableMessageList', () => {
    it('registers the scroll element so the consumer can bind useScrollPin to it', () => {
        const registerContainer = vi.fn();
        mount({ ...channelBase, registerContainer });

        expect(registerContainer).toHaveBeenCalledOnce();
        expect(registerContainer.mock.calls[0][0]).toBeInstanceOf(HTMLElement);
    });

    it('renders the slotted rows inside the scroll container', () => {
        const { scrollEl } = mount({
            ...channelBase,
            registerContainer: vi.fn(),
        });

        expect(scrollEl.querySelector('[data-test="rows"]')).not.toBeNull();
    });

    it('makes the channel container a focusable, labelled region', () => {
        const { scrollEl } = mount({
            ...channelBase,
            registerContainer: vi.fn(),
        });

        expect(scrollEl.getAttribute('data-test')).toBe('message-history');
        expect(scrollEl.getAttribute('role')).toBe('region');
        expect(scrollEl.getAttribute('aria-label')).toBe('Message history');
        expect(scrollEl.getAttribute('tabindex')).toBe('0');
    });

    it('leaves the thread container as a plain, unlabelled scroller', () => {
        const { scrollEl } = mount({
            ...threadBase,
            registerContainer: vi.fn(),
        });

        expect(scrollEl.getAttribute('data-test')).toBeNull();
        expect(scrollEl.getAttribute('role')).toBeNull();
        expect(scrollEl.getAttribute('tabindex')).toBeNull();
    });

    it('forwards the container scroll to the consumer', () => {
        const { scrollEl, scroll } = mount({
            ...channelBase,
            registerContainer: vi.fn(),
        });

        scrollEl.dispatchEvent(new Event('scroll'));

        expect(scroll).toHaveBeenCalledOnce();
    });

    it('hides the pill while pinned and shows it once scrolled up', () => {
        const pinned = mount({
            ...channelBase,
            pinnedToBottom: true,
            registerContainer: vi.fn(),
        });
        expect(pinned.pill()).toBeNull();

        const scrolled = mount({
            ...channelBase,
            pinnedToBottom: false,
            registerContainer: vi.fn(),
        });
        expect(scrolled.pill()?.getAttribute('data-test')).toBe(
            'jump-to-latest',
        );
    });

    it('emits jump when the pill is clicked', () => {
        const { pill, jump } = mount({
            ...channelBase,
            registerContainer: vi.fn(),
        });

        pill()!.click();

        expect(jump).toHaveBeenCalledOnce();
    });

    it('labels the channel pill "Jump to present" at rest and counts new messages', () => {
        const rest = mount({ ...channelBase, registerContainer: vi.fn() });
        expect(rest.pill()?.textContent).toContain('Jump to present');
        expect(rest.pill()?.getAttribute('data-new-count')).toBe('0');

        const withNew = mount({
            ...channelBase,
            newMessageCount: 3,
            registerContainer: vi.fn(),
        });
        expect(withNew.pill()?.textContent).not.toContain('Jump to present');
        expect(withNew.pill()?.textContent).toContain(':count new messages');
        expect(withNew.pill()?.getAttribute('data-new-count')).toBe('3');
    });

    it('renders the thread pill icon-only at rest and with reply copy when new', () => {
        const rest = mount({ ...threadBase, registerContainer: vi.fn() });
        expect(rest.pill()?.getAttribute('data-test')).toBe(
            'jump-to-latest-thread',
        );
        // No text label while at rest — the thread pill is a bare icon button.
        expect(rest.pill()?.textContent?.trim()).toBe('');

        const withNew = mount({
            ...threadBase,
            newMessageCount: 2,
            registerContainer: vi.fn(),
        });
        expect(withNew.pill()?.textContent).toContain(':count new replies');
    });
});
