# BeSafe Network

BeSafe Network is a global trust and safety network for Discord and VRChat. It provides cross-platform moderation, reputation tracking, age verification, and a shared banlist that server owners can opt into.

The codebase is **open source for transparency**: anyone can read, audit, and contribute. It is **not** open for self-hosting — see [LICENSE](LICENSE) for the exact terms.

## What it does

- **Global ban cases** — moderators can create ban cases linking Discord accounts and VRChat accounts (`usr_...`) with evidence, severity, and notes. Active cases are enforced across every connected server that has opted in.
- **Discord bot workers** — sharded Discord bot workers enforce global and custom banlists on member join, run periodic ban syncs, and expose health probes over an authenticated worker socket.
- **VRChat bot workers** — horizontally sharded workers scan connected VRChat groups and ban blacklisted users.
- **Custom banlists** — server owners can link their own banlists and choose a selection mode (`global`, `custom`, or `both`).
- **Reputation & warnings** — per-server reputation thresholds and warning counts feed local auto-moderation.
- **Age verification** — verified users can be auto-assigned age roles in Discord.
- **Admin dashboard** — web dashboard for ban cases, users, guilds, custom banlists, logs, and staff management.

## Architecture

```
safety/
  server.ts                  # Web dashboard API + admin routes (Express)
  src/                       # React frontend (Vite + Tailwind)
  services/
    shared/                  # Mongoose models, config, worker transport
    web-dashboard/           # Dashboard HTTP routes (auth, public, ban-cases, ...)
    discord-bot/             # Discord gateway workers (sharded via k8s-sharding)
    vrchat-bot/              # VRChat API workers (HPA-sharded)
  docker-compose.yml         # Local multi-service setup
  k8s/                       # Kubernetes manifests + deploy script
```

The dashboard and workers communicate over an authenticated Socket.IO channel (`WORKER_AUTH_TOKEN`); worker HTTP ports are probe-only.

## Development

See [safety/README.md](safety/README.md) for local dev, Docker Compose, and Kubernetes instructions.

Quick start:

```sh
npm ci
npm run dev            # dashboard + API (tsx server.ts)
npm run start:discord  # Discord worker
npm run start:vrchat   # VRChat worker
```

## Contributing

Contributions are welcome — bug reports, documentation fixes, and code improvements via pull request. Because this project is source-available rather than OSI open source, please read the [LICENSE](LICENSE) before submitting: you may contribute code back to this repository, but you may not copy, fork, or deploy the software to run your own instances.

By submitting a contribution you agree that your changes are licensed under the same terms as the project.
