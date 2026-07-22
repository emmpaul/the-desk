export default {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'type-enum': [
            2,
            'always',
            [
                'build',
                'chore',
                'ci',
                'deps',
                'docs',
                'feat',
                'fix',
                'perf',
                'refactor',
                'revert',
                'style',
                'test',
            ],
        ],
        // Every commit that reaches `develop` or `master` is a squash commit, so GitHub composes
        // its body from the PR description — which review bots (Codesmith, CodeRabbit) and
        // release-please edit, appending footers built from unwrappable `<a href>` and image URLs.
        // Those bodies are unfixable by the time a promotion or backmerge PR lints them, so an
        // error here blocks the release flow on markup nobody wrote (PR #741). commitlint 21 fixed
        // this upstream by exempting lines with nothing to wrap on, but the action we pin still
        // ships 19 — keep the limit as a warning until it catches up. The rules that guard
        // release-please (type, subject case, header length) stay errors.
        'body-max-line-length': [1, 'always', 100],
        'footer-max-line-length': [1, 'always', 100],
    },
    // Dependabot generates verbose commit bodies whose lines exceed body-max-line-length.
    // Skip its bot commits (identified by their sign-off trailer); the PR title we squash-merge
    // is still validated by our own conventions.
    ignores: [(message) => /^Signed-off-by: dependabot\[bot\]/m.test(message)],
};
