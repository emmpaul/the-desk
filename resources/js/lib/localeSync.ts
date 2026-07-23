import { router } from '@inertiajs/vue3';
import { i18n, setMessages } from '@/lib/i18n';
import type { Messages } from '@/lib/i18n';

/** The shared props a page carries about the language it was rendered in. */
type LocalePageProps = {
    locale?: string;
    translations?: Messages;
};

/**
 * Adopt a page's shared locale and catalog when they name a language the client
 * is not rendering in yet.
 *
 * The server keys the catalog's once prop by locale, so a visit that changes the
 * effective locale carries the matching catalog while every other visit leaves
 * it out — hence the "no catalog" and "same locale" cases are both no-ops rather
 * than a reason to blank the messages.
 */
function adoptPageLocale(event: unknown): void {
    const page = (event as CustomEvent<{ page?: { props?: LocalePageProps } }>)
        .detail?.page;
    const locale = page?.props?.locale;
    const messages = page?.props?.translations;

    if (!locale || !messages || locale === i18n.locale) {
        return;
    }

    setMessages(locale, messages);
}

/**
 * Keep the rendered language in step with the shared `locale` prop for the whole
 * SPA lifetime, not just the document load that booted it (#764).
 */
export function initializeLocaleSync(): void {
    // `beforeUpdate` lands before the page swap, so a visit that changes the
    // locale is already painted in the new language — no flash of the old one.
    // A history restore swaps the page without firing it, so `navigate` covers
    // that; adopting is idempotent, so the pair never fights itself.
    router.on('beforeUpdate', adoptPageLocale);
    router.on('navigate', adoptPageLocale);
}
