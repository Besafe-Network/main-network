# BeSafe Network

## Local Development

Install dependencies, configure values from [.env.example](.env.example), then run the dashboard and each worker in separate terminals:

```sh
npm ci
npm run dev
npm run start:discord
npm run start:vrchat
```

Build the frontend and bundled dashboard server with `npm run build`.

## Separate Bot Services

The dashboard accepts authenticated Socket.IO connections from the Discord and VRChat worker containers. Set the same high-entropy `WORKER_AUTH_TOKEN` for the dashboard and each worker. Set each worker's `DASHBOARD_SOCKET_URL` to the dashboard's internal HTTP address, for example `http://web-dashboard:3000` in Docker Compose. Workers reconnect automatically; their HTTP ports do not need to be published.

Worker commands use WebSocket transport only. Worker HTTP servers expose health and readiness probes only.

## Docker Compose

Set `WORKER_AUTH_TOKEN` in the environment or `.env` file, then build the shared dependency images and application images with:

```sh
docker compose --profile build-dependencies build
docker compose up -d
```

The dependency services are build-only and are not started by `docker compose up`.

## Kubernetes

The Kubernetes manifest intentionally keeps the plaintext application and registry Secrets as the redeploy source of truth. The dashboard and both workers share its `WORKER_AUTH_TOKEN`; keep that key in `besafe-secrets` and do not replace the manifest Secrets with a second generated source.

```sh
./k8s/deploy.sh
```

The script checks for template values and applies the manifest. The cluster must have access to the image registry, Traefik, cert-manager with the `letsencrypt-dns` ClusterIssuer, and a metrics server for the VRChat HPA. The VRChat StatefulSet discovers active pods through its headless service, allowing HPA changes to repartition scan work. Image repositories match those published by `update.sh`.
