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

## Video ingestion

The offline CLI builds internal `video` lookup documents from published lesson URLs. It is a Studio-side tool and never runs during a web request.

Add `SANITY_API_READ_TOKEN` and `SANITY_API_WRITE_TOKEN` to `studio/.env.local`, then run:

```bash
npm --prefix studio run ingest:videos -- --limit 2
npm --prefix studio run ingest:videos -- --video-url "https://www.youtube.com/watch?v=GErEgIOMy_4"
npm --prefix studio run ingest:videos -- --video-url "https://www.youtube.com/watch?v=GErEgIOMy_4" --write
```

Dry-run is the default and writes nothing. `--write` requires `SANITY_API_WRITE_TOKEN` and should only be used after review. Raw provider snapshots and the run report are written to gitignored `studio/.video-ingestion/`.

YouTube transcripts and watch-page chapters are supported. Vimeo, Bunny, and unknown providers are detected and skipped; this does not add Vimeo/Bunny caption ingestion or Bunny seek support.
