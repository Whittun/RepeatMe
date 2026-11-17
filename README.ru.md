[English](README.md) | Русский

# RepeatMe

Карта знаний с карточками и интервальным повторением. Монорепозиторий на **npm workspaces** с общими командами и одним `package-lock.json`.

- `apps/web` — React, TypeScript, Vite, CSS Modules.
- `apps/api` — NestJS, TypeORM, PostgreSQL.
- `docs` — ТЗ и подробная документация.

## Первый запуск

Нужны Node.js **22.18+**, npm и запущенный Docker Desktop (Linux containers). Все команды выполняются из корня проекта:

```powershell
Copy-Item .env.example .env
npm ci
docker compose up -d --wait
npm run db:migrate
npm run dev
```

Frontend: **http://127.0.0.1:5173** (если порт занят, Vite покажет другой адрес в терминале). API: **http://127.0.0.1:3001/api**. Frontend обращается к API через Vite-прокси.

## Повторный запуск и остановка

```powershell
docker compose up -d --wait
npm run dev
```

Остановка приложения — **Ctrl+C**, базы — `docker compose stop`. Данные PostgreSQL сохраняются в Docker volume. Запускайте только один экземпляр `npm run dev`: второй API получит ошибку `EADDRINUSE` на порту 3001.

## Сборка и проверки

```powershell
npm run build             # Сборка frontend и backend
npm test                  # Правила повторения и даты
npm run test:integration  # Нужна работающая БД; создаётся отдельная тестовая БД
npm run test:http         # Нужен запущенный API; тестовые объекты очищаются
```

Настройки подключения — в корневом `.env`. При изменении `PORT` API обновите прокси в `apps/web/vite.config.ts`.

Подробнее: [документация разработки](docs/development.ru.md), [ТЗ MVP](docs/RepeatMe_MVP_spec.ru.md), [визуальный стиль и референсы](docs/design.ru.md).
