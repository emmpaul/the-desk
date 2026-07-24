<?php

declare(strict_types=1);

use Symfony\Component\Yaml\Yaml;

/**
 * Every commit that lands on `develop` or `master` is a squash commit, so GitHub builds its body
 * from the PR description — which release-please writes and review bots edit, appending footers made
 * of unwrappable `<a href>` and image URLs. `commitlint` then re-reads those commits on the backmerge
 * and promotion PRs, where the message can no longer be changed, so an over-length body line becomes
 * an unfixable merge blocker on the release flow (PR #741). These tests pin the two length rules to
 * warnings, and pin the workflow to not promote warnings back into failures.
 */
function commitlintConfigSource(): string
{
    return (string) file_get_contents(dirname(__DIR__, 2).'/commitlint.config.mjs');
}

/**
 * The `with:` inputs of the step running the commitlint action.
 *
 * @return array<string, mixed>
 */
function commitlintStepInputs(): array
{
    $workflow = Yaml::parse((string) file_get_contents(dirname(__DIR__, 2).'/.github/workflows/commitlint.yml'));

    foreach ($workflow['jobs']['commitlint']['steps'] as $step) {
        if (str_starts_with((string) ($step['uses'] ?? ''), 'wagoid/commitlint-github-action@')) {
            return $step['with'] ?? [];
        }
    }

    return [];
}

test('the body and footer length limits are warnings, not merge blockers', function (string $rule): void {
    expect(commitlintConfigSource())->toMatch("/'{$rule}':\s*\[\s*1\s*,/");
})->with(['body-max-line-length', 'footer-max-line-length']);

test('the commitlint workflow does not fail on warnings', function (): void {
    expect(commitlintStepInputs())->not->toHaveKey('failOnWarnings');
});

test('the commitlint workflow uses our config file', function (): void {
    expect(commitlintStepInputs()['configFile'] ?? null)->toBe('commitlint.config.mjs');
});
