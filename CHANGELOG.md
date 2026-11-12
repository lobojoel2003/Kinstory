# Changelog

All notable changes to Kinstory are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and Kinstory uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-11-12

The first release: everything needed to gather a storyteller's answers over a
year of weeks and print them as a book.

### Capture

- Private answer link for each storyteller: one question, one large record
  button, playback before sending, upload of an existing voice note. No
  account, nothing to install; keeps the screen awake while recording.
- Phone line through any TwiML gateway (Twilio, SignalWire): callers are
  recognised by caller ID or a six-digit code, hear the question read aloud
  and talk as long as they like. Signed webhooks; recordings are deleted from
  the gateway once downloaded.
- Weekly delivery by phone call, text message or email at a day and time in
  the storyteller's own time zone, with answering-machine detection.
- Printable card for the fridge with the phone number, code and a QR code.
- Phone script and answer page in English, Spanish, French, German, Italian,
  Portuguese and Dutch.

### Stories

- Local transcription with whisper.cpp, or any whisper.cpp server or
  OpenAI-compatible endpoint; pauses become paragraphs.
- One-click removal of hesitation sounds and stutters; re-transcription that
  never overwrites your edits without asking.
- Question queue with a library of more than fifty questions, credited to
  whoever asked them.
- Story editor with recordings, pull quotes, parts, photos (captions, layouts
  and placement) and draft/ready status.
- Family members by single-use invitation links.

### The book

- Typst typesetting with three bundled typefaces (Heirloom, Almanac, Field
  Notes) and five trim sizes.
- Half title, frontispiece, title page, colophon, dedication, contents, part
  pages, recto chapter openings, running heads, folios, afterword, an index of
  every question asked and a note on the type.
- Measured three-line drop caps with small-capital lead-ins, balanced titles,
  pull quotes, end marks, and floating photos that never strand text.
- Optional QR codes to hear each story in the storyteller's voice.
- Print-ready interior and cover PDFs, with bleed for Lulu or for KDP and
  IngramSpark, and the spine sized from the page count and paper.
- Live two-page spread preview in the browser.

### Running it

- Docker image with whisper.cpp, Typst and ffmpeg for linux/amd64 and
  linux/arm64; Compose file with PostgreSQL.
- Durable PostgreSQL job queue shared safely by several processes; graceful
  shutdown.
- Full export of recordings, transcripts, Markdown stories, photos and PDFs.
- Version, build number and commit in the footer and at `/api/health`.
- Unit, integration (PostgreSQL, ffmpeg, Typst) and Playwright end-to-end
  tests, a whisper.cpp transcription smoke test, CodeQL and Dependabot.

[Unreleased]: https://github.com/lobojoel2003/Kinstory/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/lobojoel2003/Kinstory/releases/tag/v1.0.0
