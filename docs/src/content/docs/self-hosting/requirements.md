---
title: Requirements
description: What you need before you install The Desk — Docker, a domain, and a TLS-terminating reverse proxy.
---

Before you install The Desk, make sure your host meets these requirements.

## Host

- **Docker Engine 24+** and the **Docker Compose plugin** (`docker compose`, not
  the legacy `docker-compose` binary).
- A Linux host is recommended. Anything that runs a recent Docker Engine works.

## Network & TLS

- **A domain name** pointing at your host.
- **A TLS-terminating reverse proxy** (nginx, Caddy, Traefik, …) in front of the
  stack. **TLS/HTTPS is your responsibility** — the containers speak plain HTTP.
- Your proxy must **forward WebSocket upgrade requests** to the `reverb` service,
  so real-time features (new messages, typing, presence) work.

See [Reverse proxy & TLS](/self-hosting/reverse-proxy/) for concrete proxy
configuration.

## Mail

The Desk sends transactional email (email verification, workspace invitations),
so you need **working SMTP credentials**. Without them, new users cannot verify
their address and sign-in flows that depend on email will not complete.

## Resources

The Desk is modest to run. A small VPS (2 vCPU / 2 GB RAM) comfortably hosts a
team; scale up as your message volume and search index grow. The full list of
services and what each one does is in the [Architecture reference](/reference/architecture/).
