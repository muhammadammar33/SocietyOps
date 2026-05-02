# SocietyOps

SocietyOps is a full-stack society management platform for housing communities. It includes a NestJS API, a Next.js web dashboard, PostgreSQL, and Prisma.

## Tech Stack

- **Web:** Next.js, React, Tailwind CSS
- **API:** NestJS, Prisma, JWT auth
- **Database:** PostgreSQL
- **Tooling:** npm workspaces, Docker Compose

## Project Structure

```txt
apps/
  api/      NestJS backend and Prisma schema
  web/      Next.js frontend
docker-compose.yml
package.json
```

## Local Setup

Install dependencies from the repo root:

```bash
npm install
```

Start PostgreSQL:

```bash
npm run db:up
```

Create the API env file:

```bash
cp apps/api/.env.example apps/api/.env
```

Generate Prisma client and run migrations:

```bash
cd apps/api
npm run prisma:generate
npm run prisma:migrate -- --name init
```

Optionally seed demo data:

```bash
npm run prisma:seed
```

Run the API and web app from the repo root:

```bash
npm run dev:api
npm run dev:web
```

Local URLs:

- Web: `http://localhost:3000`
- API: `http://localhost:4000/api/v1`
- Health check: `http://localhost:4000/api/v1/health`

## Build

```bash
npm run build:api
npm run build:web
```

## Environment Variables

API variables are defined in `apps/api/.env.example`.

Important production values:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `FRONTEND_URL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

The web app uses:

```txt
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com/api/v1
```

## Deployment

Recommended hosting:

- API and PostgreSQL: Render
- Web: Vercel

API build/start commands:

```bash
npm install && npx prisma generate && npm run build
npx prisma migrate deploy && npm run start:prod
```

Web build command:

```bash
npm run build
```

Set the web project root to `apps/web` and the API project root to `apps/api` when using monorepo deployment.

## Notes

- Do not commit `.env` files.
- Run `npx prisma migrate deploy` in production instead of `prisma migrate dev`.
- The seed file creates demo credentials. Change production passwords after first login.
