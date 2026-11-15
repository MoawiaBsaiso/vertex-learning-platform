# Implementation Prompt: Vertex Home Page

## 1. Goal

Implement the Vertex home page at `/` from `design/vertex-home.png` with high visual fidelity at the reference viewport (`1024x1536`) and sensible responsive behavior down to mobile. Preserve the existing `/design-system` route and reuse the established Vertex design tokens, typography, and icons rather than introducing a second visual system.

The work is presentational only. It does not add Sanity, Clerk, search, progress, or analytics integrations.

## 2. Skills And Docs Read

- `AGENTS.md`: project workflow, UI fidelity, scope boundaries, Next.js 16 requirements, and verification rules.
- No specialized project skill matches this isolated static frontend implementation.
- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`: App Router pages, `Link`, and route boundaries.
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`: keep the page server-rendered unless browser-only interactivity is required.
- `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md`: Tailwind for most styling and uniquely prefixed global CSS for complex page-only decoration.
- `node_modules/next/dist/docs/01-app/01-getting-started/12-images.md`: local assets and `next/image` sizing.
- `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md`: continue using the existing optimized Inter and Playfair Display setup.
- `node_modules/next/dist/docs/01-app/01-getting-started/14-metadata-and-og-images.md`: static metadata in a Server Component route/layout.

## 3. Code Inspected

- `package.json`: Next.js `16.4.6`, React `19.3.0`, Tailwind CSS `4.3.3`, TypeScript `5`; no third-party icon or UI package.
- `next.config.ts`: Cache Components and partial prefetching are enabled; no remote image hosts are configured.
- `app/page.tsx`: temporary centered placeholder currently occupies `/`.
- `app/layout.tsx`: already loads Inter and Playfair Display and applies the project design tokens; root metadata still describes only the design system.
- `app/globals.css`: contains the established Vertex color, font, radius, shadow, and type-scale tokens.
- `app/design-system/page.tsx`: owns route-specific metadata and must remain unchanged visually.
- `components/icons/VertexIcons.tsx`: contains the Vertex logo plus Bell, Search, Bar Chart, Clock, Document, and Chevron icons needed by the reference.
- `components/ui/Input.tsx`, `components/ui/Button.tsx`, `components/cards/Cards.tsx`, and `components/navigation/Navigation.tsx`: useful design-system patterns, but their compact dimensions do not match the larger home-page search field, header, or course cards.
- `design/vertex-home.png`: `1024x1536` reference containing the striped page frame, navigation, centered search hero, three large course cards, weekly-content divider, and peach skyline decoration.

## 4. Decisions And Assumptions

1. Keep `app/page.tsx` a Server Component. Native links and form controls provide the required behavior without shipping a page-wide client bundle.
2. Use the screenshot's copy and sample course data exactly:
   - Next.js for Production: Intermediate, 18h 24m, 12 modules.
   - Docker Essentials: Beginner, 10h 12m, 8 modules.
   - TypeScript Deep Dive: Intermediate, 14h 36m, 10 modules.
3. Reuse existing Vertex icon components and add only the small missing page icons needed for fidelity, such as a horizontal arrow and outlined star.
4. Create the Next.js, Docker, and TypeScript marks as lightweight inline SVG/CSS artwork. Do not add an icon dependency or load logo assets from third-party domains.
5. Extract the small profile portrait from the supplied reference into a local optimized asset under `public/images/`. This preserves the provided visual without adding a remote image host or unrelated stock imagery.
6. Keep navigation destinations future-facing without building extra pages: Courses and both course CTAs point to `#courses`; My Learning points to `/my-learning`; the search form submits a `q` query to `/search`. Those product routes are intentionally not implemented in this task.
7. The `⌘ K` badge is visual in this static implementation. Global keyboard-shortcut behavior belongs with the future search feature and is not added here.
8. Use uniquely prefixed, page-scoped CSS selectors only for effects that are awkward or noisy in utilities: diagonal edge stripes, warm ambient glow, and the blurred peach skyline. The configured Turbopack CSS loader emits module selectors globally and exposes an empty module export, so this route imports `home.css` for side effects instead of relying on a broken CSS Module class map. Use Tailwind utilities for layout, spacing, type, borders, and responsive behavior.
9. Match the reference composition at a `1024px` content width while keeping the page background full-bleed. On narrower screens, wrap the header into two rows when needed, scale the hero type/search field, stack course cards, and preserve all content without horizontal overflow.
10. Keep `/design-system` intact. Shared token changes are allowed only if needed to expose an already-established color; page-specific values stay scoped to the home page.

## 5. Files Expected To Touch

- `prompts/vertex-home-page.md`: this approved implementation contract.
- `app/page.tsx`: replace the placeholder with the complete semantic home page and route metadata.
- `app/home.css`: uniquely prefixed page-scoped frame, background glow, stripe, skyline, and responsive decorative styles.
- `app/layout.tsx`: change root metadata from design-system-only wording to Vertex platform wording; `/design-system` keeps its own metadata override.
- `components/icons/VertexIcons.tsx`: add only missing generic arrow/star icons if the page needs them.
- `public/images/vertex-profile.png`: local profile portrait extracted from the supplied reference.

No backend routes, dependencies, or unrelated design-system components will be changed.

## 6. Requirements

### Desktop Fidelity

- Render the page full-bleed edge-to-edge with no outer margins, side borders, or diagonal gutter rails.
- Extend the warm page background, header divider, hero divider, and bottom peach gradient across the full viewport width.
- Center the header, course content, and weekly note within a shared `1024px` content width with responsive horizontal padding.
- Header:
  - Approximately `98px` tall at the reference viewport.
  - Vertex logo at left, Courses and My Learning navigation in the center-left, Bell icon and circular portrait at right.
  - Fine warm-gray bottom divider.
- Hero:
  - Warm off-white background with a subtle centered peach glow.
  - Outlined `INTELLIGENT LEARNING` eyebrow.
  - Two-line Playfair Display headline: `Search your learning / in plain English.`
  - Exact supporting copy from the reference.
  - Coral `Explore Courses` CTA with arrow, rounded corners, and warm shadow.
  - Large white search field with Search icon, exact placeholder, `⌘ K` badge, warm border, and soft shadow.
  - Fine bottom divider.
- Courses:
  - `All Courses` Playfair heading and right-aligned `View all courses` action.
  - Three equal-height bordered cards in one desktop row.
  - Brand mark, Playfair title, exact description, divider, and three metadata items on every card.
  - Match the generous card padding, `16px` corner radius, subtle border, and very soft ambient shadow.
- Footer decoration:
  - Horizontal divider treatment around an outlined coral star and `New courses and lessons added every week.`
  - Abstract peach skyline made of staggered translucent bars fading into the bottom edge.

### Semantics And Accessibility

- Use `header`, `nav`, `main`, `section`, `article`, and heading levels in a logical hierarchy.
- Give the primary navigation and icon-only Bell control accessible names.
- Use a labelled search input and semantic GET form.
- Preserve visible keyboard focus for links, buttons, and the search input.
- Treat decorative SVGs and skyline elements as hidden from assistive technology.
- Provide descriptive profile image alt text.

### Responsiveness

- No horizontal overflow at `375px`, `768px`, `1024px`, or wider viewports.
- Keep the desktop composition exact at `1024px`.
- Stack cards at mobile widths and use two columns only when space comfortably permits.
- Allow the mobile header to wrap into a compact second navigation row rather than hiding core destinations.
- Scale the headline and hero spacing without clipping or changing the supplied copy.
- Reduce skyline height on small screens while retaining the visual motif.

## 7. Security Considerations

- No secrets, environment variables, APIs, dynamic HTML, or user-generated content are introduced.
- No remote images or third-party scripts are loaded.
- Search uses a plain GET form and does not execute or render submitted input on this page.
- Links use fixed local destinations only.

## 8. Acceptance Criteria

- `/` closely matches `design/vertex-home.png` at `1024x1536`, including spacing, typography, borders, colors, shadows, stripe frame, and skyline decoration.
- The page contains the exact visible copy and course metadata from the reference.
- The existing Inter and Playfair Display font variables are reused.
- `/design-system` remains available and visually unaffected.
- The page is usable and free of horizontal overflow at `375px`, `768px`, and `1024px` widths.
- Navigation, CTA links, Bell control, cards, and search input expose clear hover/focus states.
- No new npm dependency is added.
- `npx tsc --noEmit`, `npm run lint`, and `npm run build` complete successfully.
- A development-server smoke test confirms `/` and `/design-system` return HTTP 200.

## 9. Checks To Run

Run from the repository root:

1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`
4. Start `npm run dev` briefly and request `/` and `/design-system`; verify both return HTTP 200 with no terminal runtime errors.
5. Inspect `git diff --check` for whitespace errors.

## 10. Manual Test Steps

1. Run `npm run dev` and open `http://localhost:3000` at a `1024x1536` viewport.
2. Compare the page side by side with `design/vertex-home.png`:
   - Check the edge stripe width, header height, logo/nav/control placement, and divider.
   - Check the eyebrow, headline line breaks, supporting copy, CTA, and large search field.
   - Check the three card widths/heights, logos, copy, metadata, dividers, and shadows.
   - Check the weekly-content divider and bottom skyline silhouette.
3. Focus the search input and tab through every link/button to confirm visible focus and logical order.
4. Enter a query and submit; confirm the form targets `/search?q=<query>` without client-side script.
5. Resize to `768px` and `375px`; verify the header wraps cleanly, cards stack, text remains readable, and no horizontal scrollbar appears.
6. Open `http://localhost:3000/design-system` and confirm the existing showcase still renders normally.
