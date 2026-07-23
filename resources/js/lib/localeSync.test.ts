// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { on, listeners } = vi.hoisted(() => {
    const listeners = new Map<string, (event: unknown) => void>();

    return {
        listeners,
        on: vi.fn((event: string, callback: (event: unknown) => void) => {
            listeners.set(event, callback);
        }),
    };
});

vi.mock('@inertiajs/vue3', () => ({ router: { on } }));

import { i18n, setMessages } from '@/lib/i18n';
import { initializeLocaleSync } from '@/lib/localeSync';

/** Deliver a page to one of the registered router listeners. */
function emit(event: string, props: Record<string, unknown>): void {
    listeners.get(event)?.({ detail: { page: { props } } });
}

describe('initializeLocaleSync', () => {
    beforeEach(() => {
        on.mockClear();
        listeners.clear();
        setMessages('en', { Channels: 'Channels' });
        initializeLocaleSync();
    });

    it('adopts the catalog of a visit that changes the locale', () => {
        emit('beforeUpdate', {
            locale: 'fr',
            translations: { Channels: 'Canaux' },
        });

        expect(i18n.locale).toBe('fr');
        expect(i18n.messages).toEqual({ Channels: 'Canaux' });
        expect(document.documentElement.lang).toBe('fr');
    });

    it('also adopts it on a history restore, which skips the update event', () => {
        emit('navigate', {
            locale: 'fr',
            translations: { Channels: 'Canaux' },
        });

        expect(i18n.locale).toBe('fr');
    });

    it('leaves the catalog alone when the locale is unchanged', () => {
        emit('beforeUpdate', { locale: 'en', translations: {} });

        expect(i18n.messages).toEqual({ Channels: 'Channels' });
    });

    it('leaves the catalog alone when the visit carries none', () => {
        emit('beforeUpdate', { locale: 'fr' });

        expect(i18n.locale).toBe('en');
        expect(i18n.messages).toEqual({ Channels: 'Channels' });
    });

    it('ignores a page with no shared locale at all', () => {
        emit('beforeUpdate', {});

        expect(i18n.locale).toBe('en');
    });
});
