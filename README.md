## Future Greenhouse

Веб‑приложение для управления теплицами: мониторинг датчиков, культуры, полив, задачи, отчёты, уведомления, AI‑чат.  
Стек: **Next.js (App Router)**, **TypeScript**, **Tailwind**, **PostgreSQL (Supabase)**.

## Быстрый старт (локально)

1) Установить зависимости:

```bash
npm install
```

2) Создать `.env.local`:

```bash
JWT_SECRET=...любой_длинный_секрет...
DATABASE_URL=postgresql://... (Supabase Session pooler / direct)
OPENAI_API_KEY=... (опционально, для AI)
```

3) Инициализировать БД (локально/ручной шаг):

```bash
npm run db:setup
```

4) Запуск:

```bash
npm run dev
```

Открыть приложение на `http://localhost:3000`.

## Важно про продакшен (Vercel)

- **Seed в production выключен** по умолчанию.  
- **Авто‑init/миграции в production выключены** по умолчанию (рекомендуется выполнять как отдельный шаг).

Переменные:
- **`DB_AUTO_INIT`**: `"1"`/`"0"` — авто‑создание схемы + миграции при первом запросе (по умолчанию `dev=1`, `prod=0`)
- **`DB_AUTO_SEED`**: `"1"`/`"0"` — авто‑seed демо‑данных при первом запросе (по умолчанию `dev=1`, `prod=0`)

Рекомендуемый поток деплоя:
- в CI/локально перед деплоем: `npm run db:migrate` (и при необходимости `npm run db:seed`)
- на Vercel: `DB_AUTO_INIT=0`, `DB_AUTO_SEED=0`

## SSL и Supabase

- В **production** `sslmode=no-verify` **запрещён** (приложение упадёт при старте, чтобы не развернуть небезопасную конфигурацию).
- Для локальной отладки допустимо `...sslmode=no-verify`, но лучше использовать нормальную верификацию (`sslmode=require`).

## Роли (RBAC)

Роли: `admin`, `director`, `agronomist`, `worker`.

- **admin**: полный доступ
- **director**: доступ только для просмотра (дашборд/мониторинг/отчёты)
- **agronomist**: планирование культур/полива/задач и контроль теплиц
- **worker**: выполнение задач + ручной ввод показаний датчиков (план B при сбое датчиков)

## Демо‑аккаунты (только dev)

При `DB_AUTO_SEED=1` в dev добавляются тестовые пользователи.  
По умолчанию они **не отображаются на странице логина** — смотреть/управлять пользователями можно через админ‑раздел.

## Команды

- **`npm run db:migrate`**: схема + миграции
- **`npm run db:seed`**: демо‑данные
- **`npm run db:setup`**: migrate + seed
- **`npm run sensors:simulate --`**: живой симулятор датчиков (пишет новые строки в `sensor_data`)
- **`npm test`**: unit‑тесты (Vitest)
- **`npm run test:e2e`**: e2e smoke (Playwright)

### Живой симулятор датчиков (как будто подключены реальные сенсоры)

Симулятор работает **отдельным процессом** и периодически вставляет показания в `sensor_data`.
Это позволяет видеть «живые» обновления на вкладках мониторинга и графиках.

Примеры:

```bash
# каждые 5 секунд по всем теплицам
npm run sensors:simulate --

# только для теплицы #1, каждые 2 секунды, меньше шума
npm run sensors:simulate -- --gh 1 --interval-ms 2000 --jitter 0.15
```

План B при поломке/сбое датчиков: вкладка **`/sensor-entry`** (ручной ввод).

## Структура БД (коротко)

Основные таблицы:
- `users`, `login_history`, `action_logs`
- `greenhouses`, `employees`, `cultures`
- `sensor_data`, `watering_schedule`, `tasks`
- `notifications`, `ai_chat_history`

Временные поля унифицированы в Postgres как **`timestamptz`/`date`**.
"# FutureGreenhouse" 
