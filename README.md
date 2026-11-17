# Vertex

Vertex is a Next.js learning platform with a standalone Sanity Studio and a server-side content layer.

## Workspaces

- Root: the Next.js app, Clerk middleware, and the server-only Sanity read layer.
- `studio/`: the standalone Sanity Studio and content schemas.

## Setup

1. Install the Next.js app dependencies:

   ```bash
   npm install
   ```

2. Install the Studio dependencies:

   ```bash
   npm --prefix studio install
   ```

3. Copy `.env.example` to `.env.local` and fill in the Next.js values. The dataset is private, so `SANITY_API_READ_TOKEN` is required.
4. Copy the `SANITY_STUDIO_*` values into `studio/.env.local`.

## Development

Run the web app from the root:

```bash
npm run dev
```

Run the Studio from the root:

```bash
npm run dev:studio
```

The web app uses http://localhost:3000. The Studio uses http://localhost:3333.

## Checks

```bash
npm run typecheck
npm run lint
npm run build
npm run typecheck:studio
npm run build:studio
```

## TypeGen

Generate `sanity.types.ts` at the root after changing schemas or queries:

```bash
npm run typegen
```

The script writes `studio/schema.json` with `studio/scripts/extract-schema.ts`, then runs `sanity typegen generate`. Commit the generated types.
