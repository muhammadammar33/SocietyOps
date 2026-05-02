# SocietyOps API

NestJS backend for SocietyOps.

## Scripts

```bash
npm run start:dev
npm run build
npm run start:prod
npm run test
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## Environment

Copy `.env.example` to `.env` for local development:

```bash
cp .env.example .env
```

Required variables:

- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `FRONTEND_URL`

Optional SMTP variables enable email verification:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

## Prisma

Generate the client:

```bash
npm run prisma:generate
```

Run migrations locally:

```bash
npm run prisma:migrate
```

Run migrations in production:

```bash
npx prisma migrate deploy
```

Seed demo data:

```bash
npm run prisma:seed
```

## API

Base URL:

```txt
http://localhost:4000/api/v1
```

Health check:

```txt
GET /health
```
