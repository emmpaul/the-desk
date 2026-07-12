---
title: First user & workspace
description: Create the first account and workspace on a fresh instance — onboarding is self-service.
---

Registration is open by default, so onboarding is self-service — there is no
separate admin bootstrap step.

## Create your account

1. Visit your `APP_URL` and go to **`/register`** to create the first account.
2. **Email verification is enabled.** Make sure your [SMTP settings](/self-hosting/configuration/#mail-smtp)
   work so the verification email is delivered, then verify your address.
3. Create your first workspace from **Settings → Teams**, then invite teammates.

:::tip
If the verification email never arrives, your SMTP configuration is almost
certainly the cause. Check the `queue` container logs
(`docker compose -f docker-compose.prod.yml logs queue`) — mail is sent through
the queue worker.
:::

## Locking down registration

Public sign-ups are open by default. To run a **private / invite-only** instance:

1. Create your own account first (while registration is still open).
2. Set `REGISTRATION_ENABLED=false` in `.env` and restart the stack.

With it off, `/register` returns **404** and the "sign up" links are hidden —
existing users and email invitations still work. See
[Feature toggles](/reference/feature-toggles/#open-registration) for details.
