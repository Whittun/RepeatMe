English | [Русский](development.ru.md)

# RepeatMe development

A local knowledge map with cards and self-assessment reviews. React + TypeScript + Vite + CSS Modules; NestJS + TypeORM + PostgreSQL. Data and review history are stored on the backend. The interface is in Russian.

## Run locally

Requires Node.js 22.18+ and Docker Desktop running Linux containers. Run from the repository root:

```powershell
Copy-Item .env.example .env
npm ci
docker compose up -d --wait
npm run db:migrate
npm run dev
```

Open http://127.0.0.1:5173, or the address printed by Vite if that port is busy. API: http://127.0.0.1:3001/api. Both servers bind to the local computer. Vite proxies `/api` to port 3001. If you change the API port, also update `apps/web/vite.config.ts`. The backend reads `.env` from the repository root.

Stop the application with Ctrl+C. Stop PostgreSQL with `docker compose stop`; data persists in the Docker volume. Start the database again with `docker compose up -d --wait`. Run only one application instance to avoid a port 3001 conflict.

## Workflow

1. Create a category or card; a title is enough. Cards can also live at the root.
2. Optionally add nested categories, review criteria, source links, and Markdown material. The editor has a preview; arbitrary HTML is not executed.
3. Start a review for the whole map or a selected branch. Recall the topic, check the material or sources, and choose “Помню” (Remember) or “Не помню” (Do not remember).
4. After the server confirms the result, the next review date is displayed. Continue to the next card. A summary appears at the end; you may also end the session early.
5. To review a card ahead of schedule, open it and select “Проверить себя” (Test yourself). Move cards by changing their category in the editor; history is preserved. Only empty categories can be deleted. Deleting a card also deletes its review history after confirmation.

Rules live in `apps/api/src/rules.ts`: intervals of 1 / 3 / 7 / 14 / 30 days, then 30 days. A failed review resets the streak and schedules the next review for tomorrow. Calendar days use Europe/Moscow; history timestamps use `timestamptz`. Being overdue does not change a card's knowledge state. The backend calculates states, queues, and statistics. New cards enter the queue immediately. These are prototype settings, not a scientific memory model.

## Checks

```powershell
npm run build
npm test
npm run test:integration
npm run test:http
```

The integration test requires PostgreSQL at `DATABASE_URL` and permission to create databases (provided by the Compose user). It creates a uniquely named test database and drops it afterward, leaving application data untouched. It checks migrations and rollback, category cycles, nested statistics, nonempty category deletion, atomic writes, request retries, moving cards with history, and streak resets.

The HTTP smoke test requires a running API. It creates its own category and card, checks the persistence workflow, and cleans up only those test objects. It does not replace visual browser verification.

Build outputs: `apps/api/dist` and `apps/web/dist`. After building, start the API with `npm run start -w @repeatme/api`. Use `npm run preview -w @repeatme/web` to preview the frontend build locally. A permanent frontend deployment needs a static server with `/api` proxying.

Migrations are applied explicitly; automatic schema synchronization is disabled. `npm run db:revert` reverts the latest migration. Reverting the initial migration deletes the application tables.

## API

- `GET /api/snapshot?categoryId=<uuid>` — the tree, cards, state distributions, and queue for a branch; omit the parameter for the entire project.
- `POST /api/categories`, `PUT /api/categories/:id` — `{ name, parentId? }`.
- `DELETE /api/categories/:id` — deletes an empty category only.
- `POST /api/cards`, `PUT /api/cards/:id` — `{ title, categoryId?, criteria?, explanation?, sources?: [{ label, url }] }`. PUT replaces editable fields while preserving the schedule and history.
- `DELETE /api/cards/:id` — deletes a card and its history.
- `GET /api/cards/:id/history` — attempts, newest first.
- `POST /api/cards/:id/reviews` — `{ remembered: boolean, requestId: UUID }`. Use one UUID per attempt; on a network error, retry the same payload with the same UUID. Recording the attempt and updating the schedule happen in one transaction with a row lock.

## Structure and scope

`apps/api/src` contains three entities, a controller/service, rules, DTOs, and a migration. `apps/web/src` contains the tree, overview, card view, forms, and review session. State lives in React without a separate store. The initial database is empty.

Outside the MVP: authentication, saved groups, a canvas map, AI/Obsidian integrations, imports, notifications, audio, and collaboration. External sources open as links; their content is not downloaded.
