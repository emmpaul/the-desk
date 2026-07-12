<?php

declare(strict_types=1);

test('the public marketing page has no serious accessibility violations in either theme', function (): void {
    // The page root fades in over `duration-700` (`starting:opacity-0`). Auditing
    // before it settles reads every colour composited over the backdrop mid-fade,
    // manufacturing contrast failures — let the entrance finish first so axe sees
    // the opaque, shipped colours.
    $page = visit('/')
        ->assertSee('The Desk')
        ->wait(0.9)
        ->assertNoAccessibilityIssues();

    // Re-audit against the dark palette. Persist 'dark' to localStorage — the
    // source of truth `useAppearance` reads — before applying the `.dark` class,
    // otherwise the appearance controller re-resolves 'system' → light and reverts
    // the toggle mid-audit. The settle lets that recompute finish.
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
