<?php

declare(strict_types=1);

test('the authenticated channel page has no serious accessibility violations in either theme', function (): void {
    ['owner' => $alice] = browserTeamWithChannel();

    // Runs axe-core (bundled with the browser plugin) against the real rendered
    // DOM — the guard rail this a11y effort stands up. The default level is
    // SERIOUS (1), which keeps critical + serious violations; color-contrast
    // failures surface here, so a clean run proves the WCAG AA contrast fixes
    // (#269) hold against the shipped theme tokens.
    $page = signInThroughBrowser($alice)
        ->assertNoAccessibilityIssues();

    // Re-audit against the dark palette. Persist 'dark' to localStorage — the
    // source of truth `useAppearance` reads — before applying the `.dark` class,
    // otherwise the appearance controller re-resolves 'system' → light and
    // reverts the toggle mid-audit. The settle lets that recompute finish.
    $page->script(<<<'JS'
    () => {
        localStorage.setItem('appearance', 'dark');
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
    }
    JS);

    $page->wait(0.5)
        ->assertNoAccessibilityIssues();
});
