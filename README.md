<p align="center">
  <img src="docs/images/logo.svg" width="76" height="76" alt="Kinstory logo: an open book with a voice on one page and words on the other">
</p>

<h1 align="center">Kinstory</h1>

<p align="center">
  <b>Record a grandparent's stories by phone call or voice note, and print them as a book worth keeping.</b><br>
  Free, open source and self-hosted. The family's stories stay on the family's server.
</p>

<p align="center">
  <a href="https://github.com/lobojoel2003/Kinstory/actions/workflows/ci.yml"><img src="https://github.com/lobojoel2003/Kinstory/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI"></a>
  <a href="https://github.com/lobojoel2003/Kinstory/releases/latest"><img src="https://img.shields.io/github/v/release/lobojoel2003/Kinstory?sort=semver&color=7a2e22" alt="Latest release"></a>
  <a href="https://github.com/lobojoel2003/Kinstory/pkgs/container/kinstory"><img src="https://img.shields.io/badge/docker-ghcr.io%2Flobojoel2003%2Fkinstory-2c4436" alt="Docker image"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-23324a" alt="AGPL-3.0"></a>
</p>

<p align="center">
  <img src="docs/images/spread-opening.jpg" alt="An opening spread from a Kinstory book: a sepia photograph of a whitewashed house on the left page, and on the right the chapter 'The Night the Boats Came In Late' with the question that prompted it, a three-line drop cap and a QR code to hear the story told aloud." width="900">
</p>

---

A family's stories vanish when its elders die. The services that collect them cost around $100 a year and keep the recordings on their own servers, and many elders won't install an app. Kinstory asks your grandparent **one question a week**. They answer **on the phone they already have** or by tapping **one big button** on a private link. Their words are transcribed **on your own server** with [whisper.cpp](https://github.com/ggml-org/whisper.cpp) and typeset with [Typst](https://typst.app) into a **print-ready book**: real typography, photo layouts and the storyteller's own words.

- **No app for the storyteller.** A weekly phone call, a text with a link, or a printed card for the fridge with a number to ring.
- **The book is the product.** Drop caps measured to the line, balanced titles, running heads, pull quotes, an index of every question asked, and photos placed so they never strand a lonely line.
- **Private by design.** Speech-to-text runs locally; phone recordings are deleted from the gateway as soon as Kinstory has its copy.
- **Yours to keep.** One click exports every recording, transcript, photo and PDF in open formats.

## Contents

- [Why Kinstory](#why-kinstory)
- [How it works](#how-it-works)
- [The book](#the-book)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [The phone line](#the-phone-line)
- [Printing your book](#printing-your-book)
- [Transcription](#transcription)
- [Development](#development)
- [Architecture](#architecture)
- [Releases and versioning](#releases-and-versioning)
- [Privacy and security](#privacy-and-security)
- [License](#license)

## Why Kinstory

|                     | Price                                                                      | Book                         | Where the stories live |
| ------------------- | -------------------------------------------------------------------------- | ---------------------------- | ---------------------- |
| StoryWorth, Remento | $99 a year                                                                 | Yes                          | Their servers          |
| Storii              | $119 a year                                                                | Yes                          | Their servers          |
| StoryCorps          | Free                                                                       | No, a conversation recording | Their archive          |
| **Kinstory**        | **Free** (you pay the printer, and call minutes if you use the phone line) | **Yes, print-ready PDFs**    | **Your server**        |

Prices are from [Willow's 2026 comparison](https://willow-stories-site.pages.dev/blog/best-storyworth-alternatives-2026/), which lists no open-source option. [Remento's comparison](https://home.remento.co/remento-vs-storyworth) puts extra printed copies at $69 to $79 and describes StoryWorth's base book as 6 × 9 inches in black and white. With Kinstory you choose the trim size, typeface, colour and printer yourself.

## How it works

1. **Ask.** Start from nine good first questions and a library of fifty more written to open memories ("What did your mother's kitchen smell like?"), or write your own. Cousins and aunts can join and ask too; every question is credited in the book.
2. **Listen.** Each week Kinstory calls, texts or emails the next question. The storyteller talks for as long as they like. A phone call is recorded; on the private link one tap records a voice note. Answers arrive as transcribed stories within a minute or two.
3. **Keep.** Edit lightly, keeping their voice (one click removes the "um"s), add photos with captions, group stories into parts, then typeset. Download the interior and cover PDFs and order copies from Lulu, Amazon KDP, IngramSpark or a local print shop.

<table>
  <tr>
    <td width="34%" valign="top"><img src="docs/images/screen-answer.jpg" alt="The storyteller's answer page on a phone: 'Hello, Rosa', a question from Daniel, and one big red record button."><br><sub><b>The storyteller's page.</b> One question, one button, in their language. Nothing to install or sign in to.</sub></td>
    <td width="66%" valign="top"><img src="docs/images/screen-overview.jpg" alt="The family's overview: this week's question, the private answer link, the weekly call schedule, statistics and the book's cover."><br><sub><b>The family's overview.</b> This week's question, the private link, the weekly schedule and the latest answers.</sub></td>
  </tr>
  <tr>
    <td colspan="2"><img src="docs/images/screen-story.jpg" alt="The story editor: title, question, the transcript in a large serif editor, recordings and photos with captions and placement."><br><sub><b>The story editor.</b> Listen while you tidy the transcript, pick a pull quote, place photos.</sub></td>
  </tr>
  <tr>
    <td colspan="2"><img src="docs/images/screen-book.jpg" alt="The book designer: front matter fields on the left and a two-page spread preview of the typeset book on the right."><br><sub><b>The book designer.</b> Typeset in seconds and turn the pages before you print.</sub></td>
  </tr>
</table>

Kinstory also prints a **card for the fridge** with the phone number, a six-digit code and a QR code for the answer link. The questions page holds the **weekly queue** and the question library.

## The book

<p align="center">
  <img src="docs/images/spread-title.jpg" alt="Frontispiece photograph facing the title page 'Bread & Salt'." width="49%">
  <img src="docs/images/spread-photo.jpg" alt="A spread with a pull quote, a pair of photographs and the opening of 'Tomás and the Bicycle'." width="49%">
</p>
<p align="center">
  <img src="docs/images/spread-themes.jpg" alt="The same chapter opening set in the Almanac (Libre Caslon) and Field Notes (Newsreader) themes." width="49%">
  <img src="docs/images/spread-questions.jpg" alt="The last page of a story with an end mark, facing 'The Questions', an index of every question, who asked it and its page." width="49%">
</p>
<p align="center">
  <img src="docs/images/cover-spread.jpg" alt="The full cover spread in oxblood cloth: back cover with a quotation, and the front cover with title, a tipped-in photograph and the storyteller's name." width="80%">
</p>

The demo family in these pictures is fictional. Every release attaches the [typeset sample book](https://github.com/lobojoel2003/Kinstory/releases/latest) as PDFs.

- **Three typefaces**, all open source and bundled: _Heirloom_ (EB Garamond with Cormorant Garamond titles), _Almanac_ (Libre Caslon) and _Field Notes_ (Newsreader with Inter).
- **Five trim sizes:** 6 × 9 in, 5.5 × 8.5 in, 7 × 10 in, 8 × 10 in and A5. Larger pages get slightly larger type and a capped measure, so lines stay near 65 characters.
- **Proper book structure:** half title, frontispiece, title page, colophon, dedication, contents, part pages, chapter openings on the right-hand page, running heads, folios, an afterword and a note on the type.
- **Chapter openings** with the question that prompted the story, who asked it, when and how it was told, and a three-line drop cap with a small-capitals lead-in.
- **Photos** full width, inset, side by side or as full-page plates. They float to the top of a page (or the foot of a chapter opening), so text never strands. Black-and-white books convert photos to greyscale.
- **"Hear it in their voice":** an optional QR code on each chapter opening plays the original recording.
- **Print-ready:** bleed on every edge (Lulu) or on the outside edges (KDP, IngramSpark), and a full cover spread with the spine sized from the page count and paper.
- **Seven languages** for the book's furniture, the phone voice and the storyteller's page: English, Spanish, French, German, Italian, Portuguese and Dutch.

## Quick start

You need Docker. The image includes everything Kinstory shells out to: whisper.cpp with the multilingual `base` model, Typst and ffmpeg.

```bash
git clone https://github.com/lobojoel2003/Kinstory.git
```

```bash
cd Kinstory && cp .env.example .env
```

```bash
docker compose up -d
```

Open <http://localhost:3000> and create an account. To explore with the fictional demo family, start it with `SEED_DEMO=true` and sign in as `demo@kinstory.local` with the password `kinstory-demo`:

```bash
SEED_DEMO=true docker compose up -d
```

Before sharing answer links outside your home network, set `PUBLIC_URL` and `POSTGRES_PASSWORD` in `.env` and put a TLS reverse proxy (Caddy, Traefik or nginx) in front. Back up the `data` volume (recordings, photos, books) and the `db` volume. See [docs/deployment.md](docs/deployment.md).

## Configuration

Everything is configured with environment variables. [`.env.example`](.env.example) documents each one.

| Variable                                                         | Default                                                | What it does                                                                      |
| ---------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                   | `postgres://kinstory:kinstory@localhost:5432/kinstory` | PostgreSQL 14+ connection string                                                  |
| `PUBLIC_URL`                                                     | (none)                                                 | External address, used for answer links, phone webhooks and book QR codes         |
| `DATA_DIR`                                                       | `./data` (`/data` in Docker)                           | Recordings, photos and rendered books                                             |
| `ALLOW_SIGNUP`                                                   | `true`                                                 | Set to `false` once the family has joined; invite links keep working              |
| `TRANSCRIBE_PROVIDER`                                            | `whisper-cpp`                                          | `whisper-cpp`, `http` (whisper.cpp server or OpenAI-compatible), `fake` or `none` |
| `WHISPER_MODEL`                                                  | `/models/ggml-base.bin` in Docker                      | Any [ggml whisper model](https://huggingface.co/ggerganov/whisper.cpp)            |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | (none)                                                 | Turn on the phone line, texts and scheduled calls                                 |
| `SMTP_URL`, `MAIL_FROM`                                          | (none)                                                 | Turn on emailed questions and "new answer" alerts                                 |
| `SEED_DEMO`                                                      | `false`                                                | Create the demo family on start-up                                                |
| `WORKER`                                                         | `true`                                                 | Run the background worker in this process                                         |

## The phone line

The phone line is optional; the private answer link works without it. With a [Twilio](https://www.twilio.com) number (or any TwiML-compatible gateway such as SignalWire, via `TWILIO_API_BASE`), Kinstory can:

- **answer calls:** the storyteller rings the number, is recognised by caller ID (or keys in their six-digit code), hears this week's question read in their language, and talks;
- **place weekly calls** at the day and time you choose, in the storyteller's own time zone. Answering machines get a short message with the number to ring back;
- **text the answer link**, and send the question on demand from the overview.

Point the number's _A call comes in_ webhook at `POST {PUBLIC_URL}/api/voice/incoming`. Every webhook is verified with the gateway's HMAC signature, and each recording is deleted from the gateway once Kinstory has downloaded it. Step-by-step setup: [docs/phone-line.md](docs/phone-line.md).

## Printing your book

1. In **Book**, choose where you will print. _Lulu_ adds ⅛ in bleed on every edge; _Amazon KDP / IngramSpark_ adds it on the outside, top and bottom; _Home printing_ has none.
2. **Save & typeset.** Turn the pages in the preview, then download `interior.pdf` and `cover.pdf`. The page count, trim and spine width are shown beside the preview.
3. Upload both files to your printer with the same trim size and paper colour, and order one proof before ordering for the whole family.

Most printers need at least 24 pages (KDP) or 32 (Lulu) for a paperback; blank pages count. More in [docs/printing.md](docs/printing.md).

## Transcription

The Docker image runs **whisper.cpp** locally with the multilingual `base` model, which suits a home server. For better accuracy, build with a larger model:

```bash
docker build --build-arg WHISPER_MODEL=small -t kinstory:small .
```

Or mount any ggml model at `/models` and set `WHISPER_MODEL`. To run transcription on another machine (a desktop with a GPU, say), start the [whisper.cpp server](https://github.com/ggml-org/whisper.cpp/tree/master/examples/server) there and set `TRANSCRIBE_PROVIDER=http` and `TRANSCRIBE_URL=http://that-machine:8080/inference`. Any OpenAI-compatible `/audio/transcriptions` endpoint works the same way.

Transcripts are shaped, not rewritten: recogniser artefacts such as `[BLANK_AUDIO]` are removed, long pauses become paragraph breaks, and an optional _Remove ums and repeats_ button drops hesitation sounds and stutters. Nothing else changes, because the storyteller's own words are the point of the book.

## Development

Requirements: Node.js 22.18+ (CI uses 24), PostgreSQL 14+ and ffmpeg. Typst is downloaded for you; whisper.cpp is optional for development.

```bash
npm ci
```

```bash
npm run setup:typst
```

```bash
cp .env.example .env && npm run dev
```

Set `TRANSCRIBE_PROVIDER=fake` to work without a speech model, and run `npm run seed:demo` to load the demo family.

| Command                                             | What it does                                                                                   |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `npm run dev` / `npm run build` / `npm start`       | Develop, build and run the production server                                                   |
| `npm run check` / `npm run lint` / `npm run format` | Type-check, lint and format                                                                    |
| `npm test`                                          | Unit tests (Vitest)                                                                            |
| `npm run test:integration`                          | Postgres, ffmpeg and Typst integration tests (`DATABASE_URL_TEST`)                             |
| `npm run test:e2e`                                  | Playwright end-to-end tests against the production build (`DATABASE_URL_E2E`)                  |
| `npm run render:sample`                             | Typeset the demo book to `sample/` with no database (`--theme`, `--trim`, `--bleed`, `--mono`) |
| `npm run showcase`                                  | Regenerate the spreads used on the landing page and in this README                             |

See [CONTRIBUTING.md](CONTRIBUTING.md) for conventions.

## Architecture

```mermaid
flowchart LR
  subgraph Storyteller
    P[Phone call] --> GW[Voice gateway<br/>TwiML]
    W[Answer link<br/>voice note]
  end
  GW -- signed webhooks --> K
  W -- upload --> K
  subgraph K[Kinstory · SvelteKit + Node]
    Q[(PostgreSQL<br/>job queue)] --> WK[Worker]
    WK --> FF[ffmpeg] --> WH[whisper.cpp]
    WK --> TY[Typst] --> PDF[Interior + cover PDFs]
  end
  K --- D[(DATA_DIR<br/>audio · photos · books)]
  F[Family in a browser] --> K
```

- **SvelteKit 3 / Svelte 5** with `adapter-node`. Server code is in `src/lib/server`; routes are in `src/routes`.
- **PostgreSQL** holds everything except files. A small job queue (`FOR UPDATE SKIP LOCKED`) runs transcription, typesetting, phone downloads and weekly deliveries, so several Kinstory processes can share one database.
- **Typst templates** in [`templates/`](templates) read a JSON description of the book written by [`book-data.ts`](src/lib/server/book/book-data.ts). The fonts in [`fonts/`](fonts) are bundled, so books typeset the same way everywhere.
- **Files** live under `DATA_DIR` with path-checked keys and atomic writes.

## Releases and versioning

Kinstory follows [Semantic Versioning](https://semver.org). Every change is recorded in [CHANGELOG.md](CHANGELOG.md).

- **Tags** `vMAJOR.MINOR.PATCH` trigger the [release workflow](.github/workflows/release.yml). It checks that the tag matches `package.json` and the changelog, runs the test suites, and publishes a GitHub release with notes from the changelog, a ready-to-run tarball, the sample book PDFs and `SHA256SUMS.txt`.
- **Docker images** for `linux/amd64` and `linux/arm64` are pushed to `ghcr.io/lobojoel2003/kinstory` as `1.0.0`, `1.0`, `1` and `latest`. Every commit to `main` is published as `edge`, `main-<build>` and `sha-<commit>`.
- **Build numbers** are the GitHub Actions run number. Each build records its version, build number, commit and date, shown in the footer and at `GET /api/health`, for example `1.0.0+42.3f2a9c1`. Images carry the same values as OCI labels.

Releasing is described in [docs/releasing.md](docs/releasing.md).

## Privacy and security

- Storytellers never have accounts. Their answer links are 144-bit random tokens; regenerating one revokes the old one. Answer, listen and invite pages send `Referrer-Policy: no-referrer`.
- Passwords are hashed with scrypt; session cookies are `HttpOnly` and `SameSite=Lax`, and only a SHA-256 of the session token is stored.
- Form posts are checked against the site's origin; the phone webhooks are checked against the gateway's signature instead.
- Uploaded photos are re-encoded, which strips location data. Exports leave out answer links and phone codes.
- Listening pages behind the book's QR codes work only while the family keeps that option switched on.

Please report vulnerabilities privately; see [SECURITY.md](SECURITY.md).

## License

Kinstory is free software under the [GNU Affero General Public License v3.0](LICENSE). If you run a modified Kinstory for other people, offer them its source.

The bundled fonts (EB Garamond, Cormorant Garamond, Libre Caslon, Newsreader and Inter) are under the [SIL Open Font License](fonts/eb-garamond/OFL.txt). Kinstory stands on [whisper.cpp](https://github.com/ggml-org/whisper.cpp), [Typst](https://github.com/typst/typst), [SvelteKit](https://svelte.dev), [PostgreSQL](https://www.postgresql.org), [FFmpeg](https://ffmpeg.org) and [sharp](https://sharp.pixelplumbing.com).
