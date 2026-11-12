# Contributing to Kinstory

Thank you for helping families keep their stories. Bug reports, translations,
new questions for the library, typographic improvements and code are all
welcome.

## Getting set up

1. Install Node.js 22.18 or newer, PostgreSQL 14 or newer, and ffmpeg.
2. Create a database and user (the defaults in `.env.example` assume
   `kinstory` / `kinstory`), plus `kinstory_test` and `kinstory_e2e` for the
   test suites.
3. Install dependencies and the pinned Typst binary:

   ```bash
   npm ci
   ```

   ```bash
   npm run setup:typst
   ```

4. Copy `.env.example` to `.env`, set `TRANSCRIBE_PROVIDER=fake` unless you
   have whisper.cpp installed, and start the dev server:

   ```bash
   npm run dev
   ```

5. Load the demo family to have something to look at:

   ```bash
   npm run seed:demo
   ```

## Before you open a pull request

```bash
npm run lint && npm run check && npm test
```

```bash
npm run test:integration
```

```bash
npm run build && npm run test:e2e
```

CI runs all of these, a whisper.cpp smoke test and a Docker build.

## Conventions

- **TypeScript everywhere**, with explicit `.ts` extensions on imports
  (`#lib/server/db.ts`), so modules also run under Node's native type
  stripping.
- **Server-only code** lives in `src/lib/server`. Every load function, action
  and endpoint under `/p/[id]` calls `requireProject()`. Never trust a route
  parameter on its own.
- **SQL** uses the `postgres` tagged template. Never build SQL from strings.
  Schema changes go in a new file in `migrations/`. Never edit a released
  migration.
- **Copy** is plain and warm. The storyteller-facing strings in
  `src/lib/elder-strings.ts` and the book's labels in
  `src/lib/server/book/labels.ts` must stay translated in every language; a
  unit test checks this.
- **Typesetting** changes in `templates/` should be checked with
  `npm run render:sample -- --previews` in all three themes (`--theme caslon`,
  `--theme modern`) and at least one other trim size.
- Format with Prettier (`npm run format`).

## Translations

To add a language, add entries to `LANGUAGES` in `src/lib/book-options.ts`,
`BOOK_LABELS` in `src/lib/server/book/labels.ts`, and `ELDER_STRINGS` and
`PHONE_VOICES` in `src/lib/elder-strings.ts`. Write them as a native speaker
would say them to their grandmother.

## Commit messages and releases

Write commit messages in the imperative ("Add Welsh translation"). Add a line
under `## [Unreleased]` in `CHANGELOG.md` for anything a user would notice.
Maintainers cut releases as described in [docs/releasing.md](docs/releasing.md).

By contributing you agree that your work is licensed under the AGPL-3.0, like
the rest of Kinstory.
