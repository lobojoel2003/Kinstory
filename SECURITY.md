# Security policy

Kinstory stores something irreplaceable: a family's recordings of people who
may no longer be alive. We take reports seriously.

## Supported versions

| Version | Supported |
| ------- | --------- |
| 1.x     | Yes       |
| < 1.0   | No        |

## Reporting a vulnerability

Please **do not open a public issue**. Use GitHub's
[private vulnerability reporting](https://github.com/lobojoel2003/Kinstory/security/advisories/new)
with a description, the affected version (shown at `/api/health`) and steps to
reproduce. You will get an acknowledgement within a week, and we will
coordinate a fix and disclosure with you.

## What to expect from a deployment

- Run Kinstory behind HTTPS. Answer links, session cookies and phone webhooks
  all assume it.
- Set a strong `POSTGRES_PASSWORD`, and `ALLOW_SIGNUP=false` once your family
  has joined.
- Keep `DATA_DIR` and database backups somewhere private: they contain the
  recordings.
- Treat each storyteller's answer link and phone code like a password. Use
  **New link** in Settings if one was shared too widely.
