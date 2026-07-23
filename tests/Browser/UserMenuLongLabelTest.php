<?php

declare(strict_types=1);

use App\Enums\AppLocale;

/**
 * The user menu is only ever as wide as the dock it hangs off (its content
 * tracks the trigger width and floors at min-w-64), so a locale whose
 * translation runs longer than the English has nowhere to go. Every label row
 * therefore renders its text as a truncating flex child rather than as a bare
 * text node: without that, "Pause notifications" — twice the length in French —
 * wrapped out of its fixed h-9 row and left the submenu chevron floating beside
 * a two-line block (#760).
 */

/**
 * A script asserting every fixed-height label row of the presence menu still
 * measures exactly one 36px line (h-9) — the height a wrapped label overflows.
 */
function everyMenuRowIsOneLine(): string
{
    $rows = json_encode([
        'set-status-menu-item',
        'toggle-presence-menu-item',
        'pause-notifications-menu-item',
        'settings-menu-item',
        'keyboard-shortcuts-menu-item',
        'replay-tour-menu-item',
    ], JSON_THROW_ON_ERROR);

    return <<<JS
    (() => {
        const rows = {$rows}.map(name => document.querySelector('[data-test="' + name + '"]'));

        return rows.every(row => row !== null && Math.round(row.getBoundingClientRect().height) === 36);
    })()
    JS;
}

test('the presence menu keeps its rows on one line in French', function (): void {
    ['owner' => $alice] = browserTeamWithChannel();
    $alice->update(['locale' => AppLocale::French]);

    signInThroughBrowser($alice)
        ->click('@sidebar-menu-button')
        ->assertPresent('@pause-notifications-menu-item')
        // Let the dropdown settle past its open/pointer-grace window.
        ->wait(0.5)
        // The French catalog is the one the middleware inlined...
        ->assertSee('Pause des notifications')
        ->assertSee('Définir un statut')
        ->assertSee('Se marquer absent')
        // ...and no row has grown a second line under it.
        ->assertScript(everyMenuRowIsOneLine(), true)
        // The shipped French label fits the row outright, so the guard below
        // never has to ellipsise it — no French user reads a clipped label.
        ->assertScript(<<<'JS'
        (() => {
            const label = document.querySelector('[data-test="pause-notifications-menu-item"] span');

            return label.scrollWidth <= label.clientWidth;
        })()
        JS, true)
        // The submenu chevron still sits on the row's own centre line, rather
        // than beside a taller block.
        ->assertScript(<<<'JS'
        (() => {
            const row = document.querySelector('[data-test="pause-notifications-menu-item"]');
            const chevron = [...row.querySelectorAll('svg')].at(-1);
            const rowBox = row.getBoundingClientRect();
            const chevronBox = chevron.getBoundingClientRect();

            return Math.abs(
                (chevronBox.top + chevronBox.height / 2) - (rowBox.top + rowBox.height / 2),
            ) <= 1;
        })()
        JS, true)
        // The pause presets and the quiet-hours footer row of the flyout hold
        // their own heights in French too.
        ->click('@pause-notifications-menu-item')
        ->assertPresent('@pause-notifications-submenu')
        ->assertScript(<<<'JS'
        (() => {
            const submenu = document.querySelector('[data-test="pause-notifications-submenu"]');
            const rows = [...submenu.querySelectorAll('[data-test]')];

            return rows.length > 0
                && rows.every(row => Math.round(row.getBoundingClientRect().height) === 32)
                && submenu.scrollWidth <= submenu.clientWidth;
        })()
        JS, true);
});

test('a menu label longer than the row ellipsises instead of wrapping', function (): void {
    ['owner' => $alice] = browserTeamWithChannel();

    // The guard has to hold for any locale, not just the French string that
    // exposed it, so drive it with a label no translation would ever exceed.
    signInThroughBrowser($alice)
        ->click('@sidebar-menu-button')
        ->assertPresent('@pause-notifications-menu-item')
        ->wait(0.5)
        ->assertScript(<<<'JS'
        (() => {
            const label = document.querySelector('[data-test="pause-notifications-menu-item"] span');
            label.textContent = 'Benachrichtigungen vorübergehend stummschalten und pausieren';

            return true;
        })()
        JS, true)
        ->assertScript(everyMenuRowIsOneLine(), true)
        ->assertScript(<<<'JS'
        (() => {
            const label = document.querySelector('[data-test="pause-notifications-menu-item"] span');

            // One rendered line, clipped rather than wrapped: the text overflows
            // its own box (so the ellipsis shows) but the row does not.
            return label.getClientRects().length === 1
                && label.scrollWidth > label.clientWidth
                && getComputedStyle(label).textOverflow === 'ellipsis';
        })()
        JS, true);
});

test('the presence menu renders at its narrowest supported width', function (): void {
    ['owner' => $alice] = browserTeamWithChannel();
    $alice->update(['locale' => AppLocale::French]);

    // The rows above are measured at the narrow end of the menu, so pin that:
    // the content tracks the trigger width but floors at min-w-64 (256px), and
    // the dock is exactly that wide. The mobile sheet is wider (18rem), and the
    // collapsed dock takes the trigger off-canvas with it, so there is no
    // narrower state to check.
    signInThroughBrowser($alice)
        // See #764 — the French catalog only reaches the client on a document load.
        ->refresh()
        ->click('@sidebar-menu-button')
        ->assertPresent('@pause-notifications-menu-item')
        ->wait(0.5)
        ->assertScript(<<<'JS'
        (() => {
            const menu = document.querySelector('[data-test="pause-notifications-menu-item"]')
                .closest('[data-slot="dropdown-menu-content"]');

            return Math.round(menu.getBoundingClientRect().width) === 256;
        })()
        JS, true);
});
