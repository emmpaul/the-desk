<?php

declare(strict_types=1);

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Inertia\Ssr\Gateway;

/**
 * The SSR gateway only dispatches to the render server when a bundle is present
 * on disk. CI never builds one, but a developer who has run the SSR build has
 * `bootstrap/ssr/app.js` locally, and from then on every Inertia render inside a
 * test fires an outbound POST to the SSR server that pollutes `Http::fake()`.
 * Point the bundle at a temp file we control so the detector reports a bundle
 * without touching (or depending on) the git-ignored `bootstrap/ssr/` directory.
 */
beforeEach(function (): void {
    $this->ssrBundle = storage_path('framework/testing/ssr-bundle-fixture.js');

    File::ensureDirectoryExists(dirname($this->ssrBundle));
    File::put($this->ssrBundle, '// fixture SSR bundle');

    config(['inertia.ssr.bundle' => $this->ssrBundle]);
});

afterEach(function (): void {
    File::delete($this->ssrBundle);
});

it('issues no SSR request when dispatching an Inertia page under the testing environment', function (): void {
    Http::preventStrayRequests();
    Http::fake();

    $response = app(Gateway::class)->dispatch([
        'component' => 'Welcome',
        'props' => [],
        'url' => '/',
        'version' => null,
    ]);

    expect($response)->toBeNull();

    Http::assertNothingSent();
});
