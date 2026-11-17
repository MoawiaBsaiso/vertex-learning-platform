# Implementation Prompt: Vertex Content Model, Standalone Studio, and Read Data Layer

## 1. Goal

1. Keep the Next.js application at the repository root.
2. Create `studio/` as a standalone Sanity Studio workspace alongside the root app, and remove the embedded Studio.
3. Model the Vertex content in Sanity: `course`, embedded `module`, `lesson`, `instructor`, and `category`.
4. Add a server-only Sanity read client and a typed data-access layer for courses, lessons, instructors, and categories.

This task does not build pages, search, ingestion, progress, authentication changes, or analytics.

## 2. Skills And Docs Read

- `AGENTS.md`: workflow, scope boundaries, data model, server/client rules, private-dataset/read-token rule, verification rules.
- `sanity-best-practices` skill and references:
  - `references/schema.md`: `defineType`, `defineField`, `defineArrayMember`, references vs objects, validation, icons.
  - `references/groq.md`: projections, parameters, reference expansion, reverse references, performance.
  - `references/typegen.md`: standalone Studio TypeGen workflow, query naming, generated result types.
  - `references/nextjs.md`: standalone Studio, data fetching, caching, draft/stega separation.
  - `references/project-structure.md`: standalone Studio layout alongside a Next.js app.
  - `references/studio-structure.md`: custom desk structure, dividers, document lists.
- Sanity docs: `content-lake/http-auth` and `content-lake/keeping-your-data-safe` for server-side token handling and private-dataset CDN behavior.
- Next.js 16 docs:
  - `01-getting-started/02-project-structure.md`: top-level files and App Router layout.
  - `01-getting-started/06-fetching-data.md`: server-side data access and uncached data.
  - `01-getting-started/08-caching.md`: `use cache`, `cacheLife`, and `cacheTag`.
  - `02-guides/data-security.md`: server-only Data Access Layer and minimal DTOs.

## 3. Code Inspected

- `package.json`: single root package currently mixing Next.js, Clerk, and Sanity Studio dependencies.
- `next.config.ts`: `cacheComponents: true` is enabled, so cached reads must use the Cache Components model.
- `sanity.config.ts`, `sanity.cli.ts`, `sanity/`: embedded Studio scaffold using `basePath: '/studio'`.
- `app/studio/[[...tool]]/page.tsx`: embedded Studio route.
- `app/layout.tsx`, `app/page.tsx`, `app/design-system/page.tsx`: existing Next.js app and Clerk provider.
- `components/`, `public/`, `proxy.ts`, `tsconfig.json`, `eslint.config.mjs`: existing Next.js app files.
- `sanity/lib/client.ts`, `sanity/lib/image.ts`, `sanity/lib/live.ts`: scaffolded Sanity helpers.
- `.env.example` and `.env.local`: project/dataset are set, dataset is currently public, and no read token is set.
- Sanity project `x33ap7fq`, dataset `production`: no deployed schema and no hosted Studio application.
- `@sanity/icons@3.8.0` is installed transitively; its subpath exports are not available, so root named exports are required.

## 4. Decisions And Assumptions

1. Keep the Next.js app at the repository root. Do not create a `web/` folder and do not move `app/`, `components/`, `public/`, `next.config.ts`, `proxy.ts`, or the root configs.
2. Create `studio/` as a standalone workspace with its own `package.json`, lockfile, `tsconfig.json`, `sanity.config.ts`, `sanity.cli.ts`, `env.ts`, `structure.ts`, and `schemaTypes/`.
3. The root `package.json` keeps the Next.js app dependencies and gains convenience scripts for the Studio and root checks. The root `package-lock.json` stays in place. `studio/` gets its own lockfile.
4. Remove the embedded Studio route and root Studio config files:
   - Delete `app/studio/[[...tool]]/page.tsx`.
   - Move `sanity.config.ts` and `sanity.cli.ts` into `studio/` and rewrite them for standalone operation.
   - Move `sanity/schemaTypes/` and `sanity/structure.ts` into `studio/`.
   - Keep root `sanity/env.ts`, `sanity/lib/client.ts`, and `sanity/lib/image.ts` for the Next.js read layer.
   - Delete `sanity/lib/live.ts`.
5. Exclude `studio` from root `tsconfig.json` and `eslint.config.mjs`.
6. The root `.env.local` remains the Next.js environment file. Create `studio/.env.local` with only the public Studio project ID and dataset. Both files stay gitignored. The root `.env.example` is the canonical list for both.
7. Model only the five requested document types. Defer `video`, agent context, and progress documents.
8. Store `lesson.duration` as a number in seconds. Course totals and labels are derived in the data layer, never stored.
9. Store module order and lesson order in arrays. Module and lesson numbers (`Module 5`, `Lesson 5.1`) are derived from position in the data layer.
10. A lesson does not store its parent course. The lesson detail query resolves the course through a reverse reference and derives module/lesson context there.
11. Add an optional `course.icon` image for compact course marks used later in search/result cards; `coverImage` remains required.
12. Use TypeGen from `studio/sanity.cli.ts`, scanning the root app and Sanity folders and writing `sanity.types.ts` at the repository root. Commit the generated types. Ignore `studio/schema.json`.
13. Use `@sanity/icons@3.8.0` as a direct Studio dependency and import root named exports. Pin the version because subpath exports are unavailable in 3.8.0.
14. The dataset is private. The read client requires `SANITY_API_READ_TOKEN`, uses `useCdn: false`, and never falls back to unauthenticated reads.
15. Cache reads through a typed `sanityFetch` helper using `'use cache'`, `cacheLife('minutes')`, and `cacheTag`. Data-layer functions call that helper rather than caching their own raw reads.
16. No content import, seed data, deployment, or hosted Studio hostname is part of this task.

## 5. Files Expected To Touch

### Repository setup

- `package.json`: keep the root app dependencies; add `dev:studio`, `build:studio`, `typecheck`, `typecheck:studio`, and `typegen` scripts.
- `package-lock.json`: update only for dependency changes.
- `tsconfig.json`: add `"studio"` to `exclude`.
- `eslint.config.mjs`: add `"studio/**"` to `globalIgnores`.
- `.gitignore`: ignore `studio/node_modules`, `studio/.sanity`, `studio/dist`, and `studio/schema.json`; keep env files ignored.
- `.env.example`: add `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET`, and `SANITY_STUDIO_API_VERSION`; clarify that studio variables belong in `studio/.env.local`.
- `README.md`: document the root Next.js app, the standalone Studio, install/dev/check commands, TypeGen, and env files.
- `sanity.types.ts`: generated at the root by TypeGen.
- Delete `app/studio/[[...tool]]/page.tsx` and `sanity/lib/live.ts`.

### Studio

- `studio/package.json`
- `studio/package-lock.json` (generated)
- `studio/tsconfig.json`
- `studio/sanity.config.ts`
- `studio/sanity.cli.ts`
- `studio/env.ts`
- `studio/structure.ts`
- `studio/schemaTypes/index.ts`
- `studio/schemaTypes/documents/course.ts`
- `studio/schemaTypes/documents/lesson.ts`
- `studio/schemaTypes/documents/instructor.ts`
- `studio/schemaTypes/documents/category.ts`
- `studio/schemaTypes/objects/module.ts`
- `studio/schemaTypes/objects/learning-outcome.ts`
- `studio/schemaTypes/objects/resource.ts`
- `studio/schemaTypes/objects/block-content.ts`

### Root Sanity read layer

- `sanity/env.ts` (keep and reuse for the Next.js app)
- `sanity/lib/token.ts`
- `sanity/lib/client.ts`
- `sanity/lib/image.ts` (keep the existing builder)
- `sanity/lib/queries.ts`
- `sanity/lib/data.ts`
- `sanity/lib/format.ts`

## 6. Requirements

### 6.1 Workspace layout

- The root Next.js app must run with `next dev`, `next build`, and `eslint` exactly as before.
- `studio` must run with `sanity dev` on port `3333` and build with `sanity build`.
- The root `package.json` provides at least:
  - `dev` -> `next dev`
  - `dev:studio` -> `npm --prefix studio run dev`
  - `build` -> `next build`
  - `build:studio` -> `npm --prefix studio run build`
  - `lint` -> `eslint .`
  - `typecheck` -> `tsc --noEmit`
  - `typecheck:studio` -> `npm --prefix studio run typecheck`
  - `typegen` -> `npm --prefix studio run typegen`
- No embedded Studio code remains in the Next.js app.
- The root `tsconfig.json` and `eslint.config.mjs` do not process `studio/`.
- Root `.env.local` stays at the root. `studio/.env.local` contains only `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET` (and optionally the Studio API version). No secret is duplicated into `studio/`.

### 6.2 Content schema

Use `defineType`, `defineField`, and `defineArrayMember` everywhere. Use strict TypeScript and schema validation. Use document icons and helpful previews.

**Course** (`course`, document):

- `title` string, required, max 100.
- `slug` slug, required, source `title`, max 96.
- `summary` text, required, max 240.
- `coverImage` image, required, hotspot enabled, `alt` required.
- `icon` image, optional, no hotspot, compact course mark.
- `level` string, required, radio list: `beginner`, `intermediate`, `advanced`.
- `price` number, required, min 0, initial 0, USD; 0 means free.
- `popular` boolean, initial false.
- `studentCount` number, min 0, display only.
- `learningOutcomes` array of `learningOutcome`, min 1.
- `instructor` reference to `instructor`, required.
- `category` reference to `category`, required.
- `modules` array of embedded `module`, min 1.
- Preview: title, level subtitle, cover image.
- Use groups or fieldsets for scanability: details, marketing, curriculum.

**Module** (`module`, object):

- `title` string, required, max 100.
- `summary` text, required, max 240.
- `lessons` array of references to `lesson`, min 1, with `.unique()` validation so the same lesson cannot appear twice in one module.
- Preview: title and summary.
- No stored module number.

**Lesson** (`lesson`, document):

- `title` string, required, max 120.
- `slug` slug, required, source `title`, max 96.
- `videoUrl` url, required, `http`/`https` only, restricted to YouTube, Vimeo, or Bunny hosts:
  - YouTube: `youtube.com`, `www.youtube.com`, `m.youtube.com`, `youtu.be`, `www.youtu.be`.
  - Vimeo: `vimeo.com`, `www.vimeo.com`, `player.vimeo.com`.
  - Bunny: `iframe.mediadelivery.net`, `video.bunnycdn.com`, and `*.b-cdn.net`.
  - Implement the host check with `new URL(value)`, exact host or safe suffix matching, and a clear validation message. Reject lookalike domains.
- `thumbnail` image, required, hotspot enabled, `alt` required.
- `duration` number, required, integer, min 1, in seconds.
- `freePreview` boolean, initial false.
- `studentCount` number, min 0, display only.
- `keyPoints` array of strings, min 1, max 6.
- `proTip` text, optional.
- `notes` `blockContent`, required.
- `resources` array of `resource`, optional.
- Preview: title, duration/free preview subtitle, thumbnail.
- No parent course field.

**Instructor** (`instructor`, document):

- `name` string, required, max 100.
- `slug` slug, required, source `name`, max 96.
- `photo` image, required, hotspot enabled, `alt` required.
- `expertise` array of strings, required, min 1, each max 60, with `.unique()` validation.
- `bio` `blockContent`, required.
- Preview: name, first expertise subtitle, photo.

**Category** (`category`, document):

- `title` string, required, max 80.
- `slug` slug, required, source `title`, max 96.
- `description` text, required, max 300.
- Preview: title and description.

**Learning outcome** (`learningOutcome`, object):

- `icon` string, required, list of stable values: `code`, `layers`, `database`, `shield`, `rocket`, `target`, `terminal`, `book`, `clock`.
- `title` string, required, max 80.
- `description` text, required, max 200.
- Preview: title and icon value.

**Resource** (`resource`, object):

- `type` string, required, list: `pdf`, `link`, `repo`, `code`, `slides`.
- `title` string, required, max 120.
- `description` text, optional, max 240.
- `url` url, required, `http`/`https` only.
- Preview: title and type.

**Block content** (`blockContent`, array type):

- Portable Text block styles: normal, h2, h3, blockquote.
- Lists: bullet, number.
- Decorators: strong, emphasis, code.
- Link annotation with `href` URL and `openInNewTab` boolean.
- Image member with hotspot and required `alt`.
- Used by `lesson.notes` and `instructor.bio`.

### 6.3 Studio structure and configuration

- `studio/sanity.config.ts` has no `'use client'` and no `basePath`.
- Configure `structureTool` with a custom `structure`.
- Configure `visionTool` with the current API version.
- Structure order: Courses, divider, Lessons, Instructors, Categories. Use appropriate icons.
- `studio/env.ts` reads `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET`, and `SANITY_STUDIO_API_VERSION` with the current API version fallback.
- `studio/sanity.cli.ts` configures `api` and TypeGen with:
  - `path: '../{app,components,sanity}/**/*.{ts,tsx}'`
  - `schema: 'schema.json'`
  - `generates: '../sanity.types.ts'`
  - `overloadClientMethods: true`

### 6.4 Server-side read client and cached fetch

`sanity/lib/token.ts`:

- Import `server-only`.
- Read `process.env.SANITY_API_READ_TOKEN`.
- Throw a clear error at module load when the token is missing.
- Export the token for the server client only.

`sanity/lib/client.ts`:

- Import `server-only`.
- Create a `next-sanity` client with project ID, dataset, API version, `useCdn: false`, `perspective: 'published'`, `stega: false`, and the required read token.
- Export a typed `sanityFetch` helper:
  - Accept `{ query, params, tags }`.
  - Type the query as a `defineQuery` string and return `ClientReturn<Query>` from `@sanity/client`.
  - Use `'use cache'`, `cacheLife('minutes')`, and `cacheTag('sanity', ...tags)`.
  - Require at least one content tag from callers; always add the shared `sanity` tag.
  - Accept only serializable params and tags so the cached function remains valid.
- Do not export a browser client.

`sanity/env.ts`:

- Read `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, and `NEXT_PUBLIC_SANITY_API_VERSION`.
- Preserve the existing assert-on-missing behavior for project ID and dataset.

`sanity/lib/image.ts`:

- Keep the `@sanity/image-url` builder. It may be imported by client components because it only uses public project/dataset values.

### 6.5 GROQ queries

Create `sanity/lib/queries.ts` using `defineQuery` from `next-sanity`. Every query must have a unique, descriptive constant name. Use `$` parameters; never interpolate user input. Include `_key` for array items that UI will map. Use explicit projections; do not return whole documents.

Required query names and shapes:

- `COURSES_LIST_QUERY`: all courses with a slug, ordered by title, with:
  - `_id`, `title`, slug, `summary`, `coverImage`, `icon`, `level`, `price`, `popular`, `studentCount`.
  - instructor: `_id`, `name`, slug, `photo`, `expertise`.
  - category: `_id`, `title`, slug.
  - modules: `_key`, `title`, `summary`, and lesson summaries (`_id`, `title`, slug, `thumbnail`, `duration`, `freePreview`).
- `COURSE_BY_SLUG_QUERY`: full course detail including learning outcomes, resolved instructor (including bio), resolved category, and modules with lesson summaries.
- `COURSE_SLUGS_QUERY`: course slugs only.
- `LESSON_BY_SLUG_QUERY`: full lesson detail including `videoUrl`, `notes`, `keyPoints`, `proTip`, resources, `thumbnail`, `duration`, and a reverse-reference course projection containing enough module/lesson data to derive context.
- `LESSON_SLUGS_QUERY`: lesson slugs only.
- `INSTRUCTORS_LIST_QUERY`: instructors with name, slug, photo, expertise, and course count.
- `INSTRUCTOR_BY_SLUG_QUERY`: full instructor with bio and the instructor's courses using the same course-card fields plus module/lesson/duration data.
- `CATEGORIES_LIST_QUERY`: categories with title, slug, description, and course count.

There is no separate instructor-slugs query. `getInstructorSlugs()` derives slugs from `INSTRUCTORS_LIST_QUERY`.

### 6.6 Data layer

Create `sanity/lib/data.ts` and `sanity/lib/format.ts`. Data functions call the cached `sanityFetch` helper with the appropriate tags. They are server-only through that import.

Required functions:

- `getCourses()`: course summaries with `moduleCount`, `lessonCount`, `durationSeconds`, and `durationLabel` added.
- `getCourseBySlug(slug)`: course detail with the same derived stats, or `null`.
- `getCourseSlugs()`: string array.
- `getLessonBySlug(slug)`: lesson detail plus a derived `context`, or `null`. The raw nested course should be removed from the DTO.
- `getLessonSlugs()`: string array.
- `getInstructors()`: instructor summaries.
- `getInstructorBySlug(slug)`: instructor detail with course summaries, or `null`.
- `getInstructorSlugs()`: string array, derived from `INSTRUCTORS_LIST_QUERY`.
- `getCategories()`: category summaries with course count.

Tags:

- Courses: `course`, plus `course:${slug}` for slug-specific reads.
- Lessons: `lesson`, plus `lesson:${slug}` for slug-specific reads.
- Instructors: `instructor`, plus `instructor:${slug}` for slug-specific reads, and `course` where course data is included.
- Categories: `category` and `course`.
- Slug lists: their content tag, plus the shared `sanity` tag added by `sanityFetch`.

Derived lesson context shape:

- `course`: minimal course fields (`_id`, `title`, slug, `level`, `icon`, instructor, category).
- `module`: `_key`, `title`, `summary`.
- `moduleNumber`: 1-based index.
- `lessonNumber`: 1-based index within the module.
- `lessonLabel`: `"<moduleNumber>.<lessonNumber>"`, for example `"5.1"`.
- `previousLesson` and `nextLesson`: minimal lesson references with title, slug, and label, or `null`.

Always filter null/broken reference entries defensively. Compute course totals from resolved lesson `duration` values. Never store or invent numbers.

`format.ts`:

- `formatDuration(totalSeconds)`: human-readable label such as `18h 24m`, `45m`, or `30s`, with a safe `0m` fallback.

### 6.7 Type safety and TypeGen

- Run `npm --prefix studio run typegen` after schema and queries exist.
- Generate `sanity.types.ts` at the repository root.
- Use the generated query result types in the data layer.
- Do not hand-copy query result shapes when TypeGen provides them.
- Ensure root `tsconfig.json` includes `sanity.types.ts` and excludes `studio`.
- Commit the generated types.

## 7. Security Considerations

- The dataset is private. `SANITY_API_READ_TOKEN` is required and is read only in a `server-only` module. There is no unauthenticated fallback.
- `sanity/lib/client.ts` uses `useCdn: false` with the read token, so private content is not served through the unauthenticated CDN path.
- The token is never prefixed with `NEXT_PUBLIC_`, never imported by a client component, and never logged.
- No write token, mutation, or write route is introduced.
- All content reads use the published perspective. Drafts and release versions stay out of the web app.
- GROQ values use parameters, not string interpolation. Only validated slugs are passed as params.
- The Studio environment contains only public project/dataset identifiers. No secrets are duplicated into `studio/.env.local`.
- Before web verification, confirm the dataset is private and the read token is present. If the dataset is still public, set it private as a remote project action. If the token is missing, stop and ask the user to add a Viewer token to root `.env.local`; do not weaken the client or commit a token.
- No remote images or third-party scripts are added.
- CORS is not required for server-side reads. Add the web origin only when Studio deployment or browser-side Sanity access is introduced.

## 8. Acceptance Criteria

- The Next.js app remains at the repository root and still runs/builds as before.
- `studio/` is an independent workspace with its own package file, lockfile, config, and schemas.
- The embedded Studio route, root `sanity.config.ts`, and root `sanity.cli.ts` are gone.
- Root `tsconfig.json` and `eslint.config.mjs` exclude `studio`.
- `studio` opens at `http://localhost:3333` with Courses, Lessons, Instructors, and Categories in the custom structure.
- All five document types and the listed object types are registered and validate in Studio.
- Schema names match the reference model: `blockContent`, module lessons with `.unique()`, lesson `thumbnail` and `duration`, instructor `expertise` array with unique strings, and resource types `pdf`/`link`/`repo`/`code`/`slides`.
- Lesson `videoUrl` rejects hosts outside YouTube, Vimeo, and Bunny.
- Course modules are embedded, ordered objects with lesson references; module and lesson numbers are not stored.
- A lesson resolves its parent course through the reverse-reference query.
- TypeGen succeeds and produces root `sanity.types.ts`.
- The server-only read client requires `SANITY_API_READ_TOKEN`, uses `useCdn: false`, and the token is never exposed to the browser.
- `sanityFetch` is typed, uses `'use cache'`, `cacheLife('minutes')`, and `cacheTag`, and all data-layer reads go through it.
- The data layer exposes all nine required functions with the derived stats, instructor-slug derivation, and lesson context.
- Root typecheck, lint, and production build pass.
- `studio` typecheck and build pass.
- No pages are added and no existing UI is restyled.
- `/` and `/design-system` still return HTTP 200 from the root dev server.

## 9. Checks To Run

Run from the repository root:

1. `npm install` (only if root dependencies changed).
2. `npm --prefix studio install`
3. `npm run typecheck:studio`
4. `npm run typegen`
5. `npm run typecheck`
6. `npm run lint`
7. `npm run build`
8. `npm run build:studio`
9. Start `npm run dev`; request `/` and `/design-system`.
10. Start `npm run dev:studio`; request `http://localhost:3333`.
11. `git diff --check`

Do not run `sanity deploy` or `sanity schema deploy` without explicit approval; both affect the remote project and require a hostname decision.

## 10. Manual Test Steps

1. Ensure root `.env.local` contains the Clerk values, the Sanity project/dataset, and a valid `SANITY_API_READ_TOKEN` for the private dataset. Ensure `studio/.env.local` contains `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET`.
2. Confirm the dataset is private before running web checks. If it is public, make it private and re-run the checks.
3. Run `npm run dev:studio`, open `http://localhost:3333`, and confirm the custom structure and previews.
4. Create one category, one instructor, two lessons, and one course. Add two modules, put one lesson in each, and publish everything.
5. Confirm validation:
   - A course cannot publish without a cover image, instructor, category, or at least one module.
   - A module cannot publish with no lessons.
   - A module rejects the same lesson twice because of `.unique()`.
   - A lesson cannot publish without a video URL, thumbnail, duration, or notes.
   - A lesson rejects a URL whose host is not YouTube, Vimeo, or Bunny.
   - An instructor rejects duplicate expertise entries.
6. Confirm module and lesson order changes the derived numbering, with no number fields in Studio.
7. Run `npm run typegen` and confirm root `sanity.types.ts` updates.
8. Run `npm run dev` and confirm `/` and `/design-system` still render.
9. Use Sanity Vision with the `COURSES_LIST_QUERY`, `LESSON_BY_SLUG_QUERY`, and `INSTRUCTOR_BY_SLUG_QUERY` constants to confirm the query shapes match the data-layer expectations.
10. Confirm the lesson query resolves the parent course and that the data layer derives `Lesson 5.1` style labels from array positions.
11. Confirm no Sanity token is present in any client component or in the browser bundle.
