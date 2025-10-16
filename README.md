# QuizForge 🧠✨

AI-powered platform that turns your content into rich, interactive quizzes with analytics, anti-cheat, and a chat-driven study companion.

## ⭐ Features

- **Syllabus → Quiz in seconds**: Generate Multiple Choice, True/False.
- **AI chat assistant**: Context-aware Q&A on your materials.
- **Configurable quizzes**: Topics, difficulty, counts, and time limits.
- **Anti-cheat**: Fullscreen enforcement, tab-switch warnings, screenshot prevention.
- **Analytics**: Instant scoring, answer breakdowns, and AI explanations.

## 🧱 Monorepo structure

```
.
├─ client/   # Primary web app (React + Vite + TanStack Router)
├─ room/     # Shareable/room quiz taker (React + Vite)
└─ server/   # API (Hono on Cloudflare Workers + Drizzle ORM)
```

## 🛠️ Tech stack

- **Frontend**: React 19, Vite, TanStack Router, TailwindCSS, Radix UI
- **Backend**: Hono on Cloudflare Workers, TypeScript
- **AI**: LangChain, OpenAI/Google GenAI integrations
- **DB**: PostgreSQL + Drizzle ORM (Neon or Postgres)
- **Auth**: better-auth

## ✅ Prerequisites

- Node.js ≥ 18
- pnpm (repo uses `packageManager: pnpm`)
- Optional: Docker (for local Postgres via `docker-compose.yml`)

## 🚀 Quickstart

1. Install dependencies at the repo root:

   ```bash
   pnpm install
   ```

2. Configure environment for `server/` (Cloudflare Worker):
   Create `server/.env` (values shown are examples; adjust for your setup):

   ```env
   DATABASE_URL="postgres://test:test_123@localhost:5432/quizforge-db" # or Neon
   OPENAI_API_KEY="your_openai_api_key"
   BETTER_AUTH_SECRET="dev_secret_change_me"
   BETTER_AUTH_URL="http://localhost:8787"
   GOOGLE_CLIENT_ID="your_google_client_id"
   GOOGLE_CLIENT_SECRET="your_google_client_secret"
   FRONTEND_URL="http://localhost:3000"
   ```

3. (Optional) Start local Postgres with Docker:

   ```bash
   docker compose up -d
   ```

4. Start apps (use separate terminals):

   - Client (web app):

     ```bash
     pnpm --filter client dev
     ```

     Runs on http://localhost:3000

   - Room (shareable taker):

     ```bash
     pnpm --filter room dev
     ```

     Runs on http://localhost:5173

   - Server (Cloudflare Worker):
     ```bash
     pnpm --filter server dev
     ```
     Worker on http://localhost:8787

## 📦 Useful scripts

From package roots:

- `client/`

  - `dev`: Vite dev server on port 3000
  - `build`: `vite build && tsc`
  - `serve`: preview built app
  - `test`: unit tests via Vitest
  - `lint`, `format`, `check`: formatting and linting helpers

- `room/`

  - `dev`: Vite dev server (default port 5173)
  - `build`: `vite build && tsc`
  - `serve`: preview built app
  - `test`: unit tests via Vitest

- `server/`
  - `dev`: `wrangler dev`
  - `deploy`: `wrangler deploy --minify`
  - `cf-typegen`: generate CF Worker types
  - `db:generate | db:migrate | db:push`: Drizzle migrations

At the repo root:

- `pnpm --filter client dev`
- `pnpm --filter room dev`
- `pnpm --filter server dev`

Note: The existing root script `dev` uses multiple `--filter` flags; prefer running each service in its own terminal for clarity.

## 🗄️ Database

Use Neon for serverless Postgres in production, or local Postgres for development.

- Local via Docker (provided `docker-compose.yml`):
  - DB: `quizforge-db`
  - User: `test`
  - Password: `test_123`
  - Port: `5432`

Update `DATABASE_URL` accordingly, e.g.:

```
postgres://test:test_123@localhost:5432/quizforge-db
```

## 🧪 Testing & quality

- `client`: `pnpm --filter client test`
- `room`: `pnpm --filter room test`
- `server`: `pnpm --filter server test`

Linting/formatting in `client`:

```
pnpm --filter client lint
pnpm --filter client check
```

## 🌐 Deployment

- **client** and **room**: deploy to Vercel (see `client/vercel.json` and `room/vercel.json`)
- **server**: Cloudflare Workers via Wrangler
  ```bash
  pnpm --filter server deploy
  ```

## 🤝 Contributing

1. Fork and create a feature branch
2. Commit with clear messages
3. Open a Pull Request describing the change and test coverage

## 🔒 Security

Never commit secrets. Use environment variables or a secrets manager. Rotate keys used in development.

## 📄 License

ISC License. See the license field in `package.json`.
