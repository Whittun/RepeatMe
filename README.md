English | [Русский](README.ru.md)

# RepeatMe

A personal knowledge map with self-assessment cards and spaced repetition. An **npm workspaces monorepo** with shared root commands and a single `package-lock.json`. The MVP interface is in Russian.

- `apps/web` — React, TypeScript, Vite, CSS Modules.
- `apps/api` — NestJS, TypeORM, PostgreSQL.
- `docs` — MVP specification and development documentation.

## First run

Requires Node.js **22.18+**, npm, and Docker Desktop running Linux containers. Run all commands from the repository root:

```powershell
Copy-Item .env.example .env
npm ci
docker compose up -d --wait
npm run db:migrate
npm run dev
```

Frontend: **http://127.0.0.1:5173** (if the port is busy, Vite prints an alternative address). API: **http://127.0.0.1:3001/api**. The frontend accesses the API through the Vite proxy.

## Start again and stop

```powershell
docker compose up -d --wait
npm run dev
```

Stop the application with **Ctrl+C** and the database with `docker compose stop`. PostgreSQL data persists in a Docker volume. Run only one `npm run dev` instance at a time: a second API instance fails with `EADDRINUSE` on port 3001.

## Build and checks

```powershell
npm run build             # Build frontend and backend
npm test                  # Review rules and date boundaries
npm run test:integration  # Requires PostgreSQL; uses a separate test database
npm run test:http         # Requires a running API; cleans up its test records
```

Connection settings are in the root `.env`. If you change the API `PORT`, update the proxy in `apps/web/vite.config.ts` as well.

Read more: [development documentation](docs/development.md), [MVP specification](docs/RepeatMe_MVP_spec.md), [visual direction and references](docs/design.md).
