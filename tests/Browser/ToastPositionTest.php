<?php

declare(strict_types=1);

// Toasts must render at top-center so they never cover the bottom-anchored
// message composer (send button, attachment/emoji actions, scheduled-message
// chip). vue-sonner exposes the resolved placement on the toaster region via
// `data-y-position` / `data-x-position`.

test('toasts render at top-center in the authenticated shell', function (): void {
    ['owner' => $alice] = browserTeamWithChannel();

    signInThroughBrowser($alice)
        ->assertAttribute('[data-sonner-toaster]', 'data-y-position', 'top')
        ->assertAttribute('[data-sonner-toaster]', 'data-x-position', 'center');
});

test('toasts render at top-center on auth pages', function (): void {
    visit('/login')
        ->assertAttribute('[data-sonner-toaster]', 'data-y-position', 'top')
        ->assertAttribute('[data-sonner-toaster]', 'data-x-position', 'center');
});
