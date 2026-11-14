# Implementation Prompt: Vertex Design System

## 1. Goal

Implement the **Vertex Design System** in the Next.js App Router workspace (`app/` + `components/`) based strictly on the visual reference `design/vertex-designsystem.png`, establishing:

1. **Design tokens** (colors, typography, spacing, radii, shadows) in CSS variables and Tailwind CSS v4 `@theme` configuration (`app/globals.css`) plus `Playfair Display` and `Inter` font loading (`app/layout.tsx`).
2. **Reusable UI primitives & composite components** (`components/ui/`, `components/icons/`, `components/cards/`, `components/navigation/`) ready to be reused across upcoming Vertex pages (catalog, course detail, lesson, instructor, My Learning, and search results).
3. **Living Design System specification page** reproducing all 14 sections of `design/vertex-designsystem.png` accurately on desktop while adapting gracefully down to mobile viewports.

---

## 2. Skills & Docs Read

- `AGENTS.md` (project rules, UI fidelity rules, Next.js 16 warnings, verification requirements)
- `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md` (Tailwind CSS v4 + global CSS in App Router)
- `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md` (`next/font/google` self-hosted font optimization)
- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md` (Next.js App Router layouts and pages)
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` (Server vs Client Component boundaries)
- `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md` (`cacheComponents: true` & `partialPrefetching: true` model in Next.js 16)

---

## 3. Code Inspected

- `package.json`: Next.js `16.4.6`, React `19.3.0`, Tailwind CSS `4.3.3` with `@tailwindcss/turbopack: 4.3.3`, TypeScript `5`, ESLint `9` (`eslint-config-next`). No icon library (`lucide-react`, etc.) is installed.
- `next.config.ts`: `cacheComponents: true`, `partialPrefetching: true`, `experimental.agentFeedback: true`, and `turbopack.rules` processing `*.css` via `@tailwindcss/turbopack`.
- `tsconfig.json`: `strict: true`, path alias `@/*` -> `./*`.
- `eslint.config.mjs`: `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`.
- `app/layout.tsx`: Currently loads `Geist` and `Geist_Mono` with starter metadata.
- `app/globals.css`: Uses `@import "tailwindcss";` and `@theme inline { ... }` with default light/dark variables.
- `app/page.tsx`: Default Next.js starter welcome page.
- `design/vertex-designsystem.png`: Full 14-section visual specification sheet.

---

## 4. Decisions & Assumptions

1. **Zero external UI/icon dependencies added**: Following `AGENTS.md` ("NEVER assume a library/framework is available... Do not overbuild"), we will build crisp, accessible, zero-dependency 24x24px SVG icon components matching Section 06 (`2px` outline stroke, rounded line caps, plus filled variants) rather than adding `lucide-react` or a component library.
2. **Light-first design system theme**: The Vertex Design System specification uses a fixed light palette (`#FAFAFC` canvas, `#FFFFFF` card surfaces, `#0F172A` primary text). Remove the starter `prefers-color-scheme: dark` overrides in `app/globals.css` that would invert the page in dark-mode OS environments.
3. **Routes**:
   - Create a dedicated `/design-system` route (`app/design-system/page.tsx`) hosting the permanent living design system showcase.
   - Keep the showcase **only** at `/design-system`; `/` (`app/page.tsx`) is a minimal placeholder linking to it until the course catalog is built.
4. **Typography mapping**:
   - Load `Playfair_Display` (weights `400`, `600`, `700`, CSS variable `--font-playfair`) and `Inter` (weights `400`, `500`, `600`, `700`, CSS variable `--font-inter`) via `next/font/google` in `app/layout.tsx`.
   - Expose `--font-display` (`var(--font-playfair)`) and `--font-sans` (`var(--font-inter)`) in `@theme inline` in `app/globals.css`, with `Inter` set as the default body font.
5. **Semantic status & badge colors**: In addition to the documented Primary (`500`–`100`) and Neutral (`900`–`50`, `White`) ramps, include semantic utility tokens matching the visual reference:
   - `LESSON` badge: soft indigo background `#EEF2FF` and indigo text `#4F46E5`
   - `Completed` status: emerald `#16A34A` / `#22C55E`
   - Primary hover fill: `#EA580C`
   - Primary disabled fill: `#FFEEE5` with muted `#FDBA74` text (or soft peach `#FDE5D4`) matching Section 07.
6. **Typo correction in spec label**: Section 06 in the PNG has a minor label typo (`Filed Style`); render `Filled Style` in code while matching the exact two rows of 9 icons and 4 spec bullets.
7. **Tailwind CSS v4 compatibility**: Define theme tokens (`--color-primary-*`, `--color-neutral-*`, `--shadow-sm/md/lg/xl`, `--radius-xs/sm/md/lg/xl/full`, `--font-display`, `--font-sans`) inside `@theme inline` in `app/globals.css` so standard Tailwind utilities (`bg-primary-500`, `text-neutral-900`, `font-display`, `shadow-md`, `rounded-md`, etc.) work seamlessly across the entire codebase.

---

## 5. Files Expected to Touch

- `app/globals.css` — Vertex Design System color, typography, spacing, radius, shadow tokens (`@theme inline`) and base styles.
- `app/layout.tsx` — Load `Playfair_Display` and `Inter` via `next/font/google`, update page metadata for Vertex, apply font CSS variables and base canvas background (`bg-neutral-50 text-neutral-900`).
- `app/page.tsx` — Minimal placeholder on `/` with a link to `/design-system` (showcase not rendered here).
- `app/design-system/page.tsx` — Permanent `/design-system` route rendering `<DesignSystemShowcase />`.
- `components/icons/VertexIcons.tsx` — Brand `VertexLogo` mark + Section 06 outline & filled icons (`Bell`, `Search`, `PlayCircle`, `Document`, `Bookmark`, `BarChart`, `Clock`, `User`, `ChevronRight`) + UI/principle icons (`ChevronLeft`, `ChevronDown`, `ExternalLink`, `CheckCircle`, `Lock`, `InProgressRing`, `Folder`, `Eye`, `Grid`, `Target`, `Accessibility`).
- `components/ui/Button.tsx` — Reusable `Button` component supporting `primary`, `secondary`, `tertiary`, and `text` variants, `md` / `lg` padding sizes, `disabled` state, and optional left/right icons (`44px` height, `12px` radius, `Inter Medium`).
- `components/ui/Input.tsx` — Reusable `SearchInput` (with leading search icon + optional `⌘ K` shortcut badge) and `SelectInput` (custom styled native `<select>` with chevron icon), `44px` height, `12px` radius, `#E2E8F0` border, `#FB923C` focus border.
- `components/ui/Badge.tsx` — Reusable `Badge` (`video`, `lesson`, `popular`) and `StatusIndicator` (`in-progress`, `completed`, `now-playing`, `locked`) components.
- `components/ui/ProgressBar.tsx` — Reusable `ProgressBar` displaying track, primary-500 fill, and percentage label (`35% complete`).
- `components/cards/Cards.tsx` — Reusable `CourseCard`, `LessonVideoCard`, `LessonTopicCard`, and `ResourceCard` matching Section 12.
- `components/navigation/Navigation.tsx` — Reusable `Navbar` preview/header, `Breadcrumbs`, and `Pagination` components matching Section 13.
- `components/design-system/DesignSystemShowcase.tsx` — Client/Server composition rendering all 14 sections (`01 COLORS` through `14 PRINCIPLES`) matching `design/vertex-designsystem.png` desktop layout and responsive mobile stacking, with interactive states (live button clicks/disabled, interactive search input, working select dropdown, interactive pagination, interactive progress/tabs where helpful without deviating from the visual layout).

---

## 6. Requirements

Reproduce every section of `design/vertex-designsystem.png` accurately:

1. **Hero + 01 Colors (Row 1)**:
   - Hero card: Coral-orange `Vertex` triangle mark + `Vertex` wordmark; `Design System` (`Display 1`, `Playfair Display` 48px/56px Bold); description copy; `VERSION 1.0 • MAY 2025`.
   - `01 COLORS`: Primary swatches (`Primary 500` `#F97316`, `Primary 400` `#FB923C`, `Primary 300` `#FDBA74`, `Primary 200` `#FED7AA`, `Primary 100` `#FFEEE5`) and Neutral swatches (`Neutral 900` `#0F172A`, `Neutral 700` `#334155`, `Neutral 500` `#64748B`, `Neutral 300` `#CBD5E1`, `Neutral 200` `#E2E8F0`, `Neutral 100` `#F1F5F9`, `Neutral 50` `#FAFAFC`, `White` `#FFFFFF`).
2. **02 Typography + 03 Type Scale (Row 2)**:
   - `02 TYPOGRAPHY`: `Ag` specimens for `Playfair Display` (`Elegant • Readable • Timeless`) and `Inter` (`Clean • Modern • Highly legible`) with coral bullet dots.
   - `03 TYPE SCALE`: 8-row specification table (`Display 1`, `Display 2`, `Heading 1`, `Heading 2`, `Heading 3`, `Body Large`, `Body`, `Small`) where each style name renders in its actual font, size/line-height (scaled cleanly if needed or exact px with responsive overflow handling, rendering exact px specs on desktop).
3. **04 Spacing System + 05 Radius & Shadows (Row 3)**:
   - `04 SPACING SYSTEM`: `Base unit: 4px`, 9 proportional squares (`4` to `64`) with px and rem labels.
   - `05 RADIUS & SHADOWS`: 6 radius boxes (`4px xs`, `8px sm`, `12px md`, `16px lg`, `24px xl`, `Full circle`) and 4 elevation shadow cards (`Sm`, `Md`, `Lg`, `Xl`) with exact `rgba(15, 23, 42, ...)` definitions.
4. **06 Icons + 07 Buttons + 08 Inputs (Row 4)**:
   - `06 ICONS`: 9 outline icons + 9 filled icons (`24x24px`, `2px` outline stroke, rounded caps) + 4 spec bullets.
   - `07 BUTTONS`: 4×3 state matrix (`Primary`, `Secondary`, `Tertiary`, `Text` × `Default`, `Hover`, `Disabled`) + 4 spec bullets.
   - `08 INPUTS`: `Search / Text Input` (`Search anything...` + `⌘ K`), `Select` (`Most Relevant`), + 5 spec bullets.
5. **09 Badges / Tags + 10 Status / Indicators + 11 Progress Bar (Row 5)**:
   - `09 BADGES / TAGS`: `VIDEO`, `LESSON`, `POPULAR`.
   - `10 STATUS / INDICATORS`: `In Progress`, `Completed`, `Now Playing`, `Locked`.
   - `11 PROGRESS BAR`: Orange progress bar at `35%` + `35% complete` label.
6. **12 Cards (Row 6)**:
   - 4-column card grid: `Course Card` (`Next.js for Production`), `Lesson Card (Video)` (`Data Fetching in Server Components`), `Lesson Card (Lesson)` (`Data Fetching & Caching`), `Resource Card` (`Caching and Revalidation Guide`).
7. **13 Navigation (Row 7)**:
   - Top bar preview (`Vertex` + `Courses` active + `My Learning`), `Breadcrumbs`, and interactive `Pagination` (`< 1 2 3 ... 8 >`).
8. **14 Principles (Row 8)**:
   - 4 columns: `Clarity First`, `Consistency`, `Focus & Calm`, `Accessible` with outline icons and supporting copy.
9. **Responsiveness**:
   - Exact multi-column layout on desktop (`lg` / `xl` screens, max-width container ~1280px).
   - Sensible responsive stacking (`grid-cols-1` / `md:grid-cols-2`, horizontal scroll wrapper for wide type-scale table on narrow mobile viewports) with zero horizontal page overflow down to `375px`.

---

## 7. Security Considerations

- Pure UI/design-system implementation; no secrets, tokens, or backend API routes are introduced.
- No `dangerouslySetInnerHTML`, external font CDN `<link>` tags (use self-hosted `next/font/google`), or client-side credentials.
- All interactive controls use safe semantic HTML (`<button>`, `<input>`, `<select>`, `<nav aria-label="...">`) and accessible ARIA attributes.

---

## 8. Acceptance Criteria

- Tailwind v4 theme tokens and CSS variables match every color hex, font family, spacing unit, border radius, and box shadow in `design/vertex-designsystem.png`.
- `Playfair Display` and `Inter` load cleanly via `next/font/google` with zero fallback font flicker.
- All 14 sections render accurately on `/design-system` only, visually matching `design/vertex-designsystem.png` on desktop (`>= 1280px`) and stacking cleanly on tablet/mobile (`375px`–`1024px`). `/` shows the minimal placeholder and links to the showcase.
- Reusable components (`Button`, `Input`, `Select`, `Badge`, `StatusIndicator`, `ProgressBar`, `CourseCard`, `LessonVideoCard`, `LessonTopicCard`, `ResourceCard`, `Navbar`, `Breadcrumbs`, `Pagination`, `VertexIcons`) are cleanly typed with TypeScript and exported for use in subsequent feature pages.
- Type check (`npx tsc --noEmit`), ESLint (`npm run lint`), and production build (`npm run build`) all pass with zero errors.

---

## 9. Checks to Run

Run from workspace root (`D:\نماذج أعمال مختلفة\Design-System-Architecture\vertex`):

1. `npx tsc --noEmit` — TypeScript type check
2. `npm run lint` — ESLint check
3. `npm run build` — Production Next.js build (required since routes/layout/config-related App Router files changed)
4. `npm run dev` — Start dev server briefly and verify `/` and `/design-system` return HTTP 200 without runtime/console errors, and that only `/design-system` renders the showcase

---

## 10. Manual Test Steps

1. Run `npm run dev` in `D:\نماذج أعمال مختلفة\Design-System-Architecture\vertex`.
2. Open `http://localhost:3000/design-system` in a desktop browser (`>= 1280px` width); `http://localhost:3000` should show only the placeholder and link to it.
3. Compare the rendered page side-by-side against `design/vertex-designsystem.png` across all 14 sections:
   - Verify Hero card (`Vertex` logo, `Playfair Display` heading, `VERSION 1.0 • MAY 2025`) and `01 COLORS` swatches.
   - Verify `02 TYPOGRAPHY` (`Playfair Display` + `Inter`) and `03 TYPE SCALE` 8-row table.
   - Verify `04 SPACING SYSTEM` (`4px`–`64px`) and `05 RADIUS & SHADOWS` (`xs`–`full`, `Sm`–`Xl`).
   - Verify `06 ICONS` (outline & filled rows), `07 BUTTONS` (4 variants × 3 states, hover/focus interactions), and `08 INPUTS` (type into search input, focus border turns `#FB923C`, open/change select dropdown).
   - Verify `09 BADGES / TAGS`, `10 STATUS / INDICATORS`, and `11 PROGRESS BAR` (`35% complete`).
   - Verify `12 CARDS` (all 4 card variants), `13 NAVIGATION` (header nav, breadcrumbs, clickable pagination), and `14 PRINCIPLES`.
4. Resize browser viewport down to mobile (`375px` width) and confirm cards and grids stack cleanly with no horizontal overflow or clipped text.
