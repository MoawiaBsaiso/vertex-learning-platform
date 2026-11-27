# Implementation Prompt: Reliable Search Fallback

## Goal

Prevent the public search page from failing when the free Gemini model times out or returns no structured output. Keep Gemini and Context MCP as the primary intelligent path, then fall back to a deterministic, grounded Sanity keyword search that returns verified lesson cards.

## Evidence

- The browser currently receives the safe error state because Gemini intermittently times out or produces no object.
- Context MCP, dataset access, schema, and grounding are healthy.
- The exact fallback GROQ query with `$terms = ["fetch*", "cach*"]` returns 10 published lessons.
- In GROQ, `field match ["a*", "b*"]` is AND semantics. The verified fallback uses `count($terms[^.title match @ || pt::text(^.notes) match @ || ^.keyPoints[] match @]) > 0` for ANY-term semantics.

## Decisions

1. Keep `@ai-sdk/google`, Gemini, Context MCP, initial context, structured selectors, and deterministic hydration unchanged as the primary path.
2. Add a search-specific Sanity query that accepts server-generated stemmed wildcard terms and returns matching lesson IDs plus parent course/module keys.
3. If Gemini throws, times out, produces no output, or grounds to zero results while the deterministic query finds matches, use deterministic lesson selectors and pass them through the same existing grounding/ranking function.
4. Never synthesize video timestamps in fallback mode. Video results remain available only from verified Gemini/MCP selectors and ingested video documents.
5. Abort normally when the request signal is aborted; do not run fallback after client cancellation.
6. Log only that the primary path fell back, never provider bodies, raw queries, transcript text, or secrets.

## Files Expected To Change

- `sanity/lib/search.ts`: add the parameterized keyword-selector query and data helper.
- `lib/search/search.ts`: tokenize/stem the query, invoke fallback safely, and reuse grounding.
- `sanity.types.ts`: regenerate through TypeGen.

No UI, schema, environment, provider, or endpoint configuration changes are required.

## Security

- Terms are generated server-side from a validated 2-200 character query and passed as GROQ parameters, never interpolated into query text.
- Existing private Sanity token and server-only boundary remain unchanged.
- All fallback selectors are verified against canonical course/module/lesson relationships by the existing grounding function.

## Acceptance Criteria

- Gemini success still uses the intelligent MCP-ranked results.
- Gemini failure no longer shows “Search is taking a break” when deterministic lesson matches exist.
- `how do I fetch data and cache it` returns the real grounded lesson set using ANY-term semantics.
- Nonsense queries return the existing empty state rather than unrelated content.
- No fabricated videos or timestamps are returned.
- TypeGen, typecheck, lint, and the live POST verification pass.

## Checks

1. Run `npm run typegen`.
2. Run `npm run typecheck`.
3. Run `npm run lint`.
4. Run a fresh `POST /api/search` with `{"query":"how do I fetch data and cache it"}` and report exact counts/results.
5. Temporarily exercise the provider-failure path locally and confirm the API still emits a results event.
6. Run `git diff --check`.
