---
name: cut-release
description: Promote `develop` to `master` to cut a stable release. Opens the `develop` -> `master` promotion PR the way release-please and the `integration-merge` workflow expect (merge commit, never a squash), then points at the stable release PR that actually tags and publishes. Use when the user says "trigger a release", "cut a release", "promote develop", "ship a version", or asks to open a develop -> master PR.
---

Cut a stable release by promoting the candidate line to `master`.

## What a release actually is

Nothing is tagged by a push. release-please keeps a *release PR* open on each
line; merging that PR is what writes the version, tags it, and publishes the
image. So a stable release is **two merges**:

1. **The promotion.** `develop` -> `master`, merged **with a merge commit**. This
   is the PR this skill opens.
2. **The stable release PR.** release-please opens
   `release-please--branches--master` after the promotion lands. Merging it cuts
   `vX.Y.Z`.

The promotion must never be squashed: release-please reads the individual
Conventional Commits, so a squash would collapse a whole release worth of
`feat:`/`fix:` subjects into one changelog entry. The `integration-merge`
workflow (`.github/workflows/integration-merge.yml`) queues auto-merge with
`--merge` the moment the PR is opened, so the method is not a choice. If it
could not queue (a required check that has never run is not registered yet, or
auto-merge is refused), the PR is simply left open: merge it by hand, with a
merge commit.

Background: `CONTRIBUTING.md` -> *Releases*. Invariants are enforced by
`tests/Unit/ReleaseFlowTest.php`.

## Steps

1. **Use the right GitHub account.** This repo only uses `emmpaul`:

   ```bash
   gh auth status
   gh auth switch --user emmpaul   # only if it is not the active account
   ```

2. **Refresh and inspect the two branches.**

   ```bash
   git fetch origin
   git log --oneline origin/master..origin/develop
   git rev-list --count origin/develop..origin/master   # must be 0
   ```

   - If `master` is **ahead** of `develop` (count is not 0), a hotfix has not
     been back-merged. Land the `master` -> `develop` back-merge PR first (the
     `backmerge` job opens it automatically); promoting over an unmerged hotfix
     leaves `develop` holding broken code.
   - If `origin/master..origin/develop` is empty, there is nothing to promote.

3. **Check the candidate line is at a clean state.** The newest commit on
   `develop` should normally be a `chore(develop): release X.Y.Z-rc.N` commit,
   meaning the latest candidate has been cut. If a candidate release PR is still
   open on `develop`, decide with the user whether to merge it first:

   ```bash
   gh pr list --state open --json number,title,headRefName,baseRefName
   ```

   Also confirm no promotion PR is already open:

   ```bash
   gh pr list --state open --base master --json number,title,headRefName
   ```

4. **Collect what is being promoted** (changelog-relevant types only):

   ```bash
   git log --pretty='%s' origin/master..origin/develop \
     | grep -E '^(feat|fix|perf|refactor|deps)(\(|!|:)'
   ```

5. **Open the promotion PR.** Title is always `chore: promote develop to master`
   (the promotion merges as a merge commit, so the title never reaches
   release-please; `chore` keeps it out of the changelog). Write the body to a
   scratch file and pass `--body-file` so the backticks survive the shell:

   ```bash
   gh pr create --base master --head develop \
     --title 'chore: promote develop to master' \
     --body-file <scratch>/promo.md
   ```

   Body template:

   ```markdown
   Promotes the candidate line to stable. `master` is at <X.Y.Z>; `develop` has
   been cutting `<X.Y+1.0>-rc.N` on top of it and is currently at `<rc tag>`.

   Carried over:

   - `feat: ...` (#NNN)
   - `fix: ...` (#NNN)

   Merging this lets release-please open the stable release PR on `master`; that
   PR is what tags and publishes.

   **Merge with a merge commit, never a squash** - release-please reads the
   individual Conventional Commits, so a squash would collapse the whole release
   into one changelog entry. The `integration-merge` workflow queues auto-merge
   with `--merge` on this PR, so the method is not a choice; if it could not be
   queued, merge by hand with a merge commit.
   ```

   Current versions come from `git show origin/master:VERSION` and the newest
   `chore(develop): release ...` subject on `develop`.

6. **Confirm auto-merge was queued with a merge commit** (give the workflow a few
   seconds):

   ```bash
   gh pr view <N> --json autoMergeRequest,mergeStateStatus \
     --jq '{autoMerge: .autoMergeRequest.mergeMethod, state: .mergeStateStatus}'
   ```

   Expect `"MERGE"`. Anything else (or `null`) means the workflow could not
   queue it: tell the user to merge by hand **with a merge commit**, never
   squash.

7. **Tell the user what happens next.** `master` requires the branch to be up to
   date, so the promotion waits on its checks. Once it lands, release-please
   opens the stable release PR on `master`; merging *that* PR tags `vX.Y.Z`,
   publishes the `X.Y.Z` / `X.Y` / `latest` images, and triggers the automatic
   `master` -> `develop` back-merge PR (also auto-merged with `--merge`).

## Do not

- Do not squash the promotion, and do not offer it as an option.
- Do not hand-edit `CHANGELOG.md`, `VERSION`, or either
  `.release-please-manifest*.json`. release-please owns them.
- Do not tag or create a GitHub release by hand.
- Do not push directly to `master`.
