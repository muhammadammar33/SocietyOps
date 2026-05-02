# SocietyOps Web

Next.js frontend for SocietyOps.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Environment

Create `.env.local` for local frontend configuration when needed:

```txt
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
```

For deployment, set `NEXT_PUBLIC_API_BASE_URL` to the hosted API URL.

## Deployment

Deploy this app as a Next.js project with `apps/web` as the root directory.
