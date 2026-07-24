<?php

declare(strict_types=1);

use App\Enums\AppLocale;

/**
 * The message catalog rides the initial document as a once prop, so the guest
 * login page hands the client the English one. Signing in is an Inertia visit
 * rather than a document load, so nothing re-inlined the catalog the signed-in
 * user's locale asks for: the sibling `locale` prop flipped to `fr` while the
 * client kept rendering from the guest page's English catalog, and the French
 * UI only appeared after a reload (#764).
 */
test('a French user who signs in gets a French UI with no reload', function (): void {
    ['owner' => $alice] = browserTeamWithChannel();
    $alice->update(['locale' => AppLocale::French]);

    signInThroughBrowser($alice)
        // The sidebar the redirect lands on reads from the French catalog...
        ->assertSee('Canaux')
        ->assertSee('Fils de discussion')
        ->assertSee('Rappels')
        // ...and the document agrees about the language it is written in, which
        // only the Blade shell used to stamp.
        ->assertScript('document.documentElement.lang', 'fr');
});
