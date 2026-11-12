# Deploying Kinstory

Kinstory is one Node.js process plus PostgreSQL. It runs comfortably on a
small VPS, a home server or a Raspberry Pi 5 (the Docker image is published
for `linux/arm64`).

## With Docker Compose

```bash
git clone https://github.com/lobojoel2003/Kinstory.git && cd Kinstory
```

```bash
cp .env.example .env
```

Edit `.env` and set at least:

```ini
PUBLIC_URL=https://stories.example.com
POSTGRES_PASSWORD=a-long-random-password
```

Then start it:

```bash
docker compose up -d
```

To pin a release instead of `latest`, set `KINSTORY_VERSION=1.0.0` in `.env`.

### HTTPS

Put a reverse proxy in front of port 3000. With [Caddy](https://caddyserver.com),
the whole configuration is:

```caddyfile
stories.example.com {
	reverse_proxy localhost:3000
}
```

Recordings can be long, so the image already sets `BODY_SIZE_LIMIT=300M`. If
your proxy limits request bodies (nginx defaults to 1 MB), raise its limit too,
for example `client_max_body_size 300m;`.

### Resources

Transcription is the heavy part. The default `base` model needs roughly
400 MB of memory while it runs (whisper.cpp's own figure) and comfortably
outpaces real time on a few modern CPU cores; larger models are slower and more
accurate. Set `WHISPER_THREADS` to the number of cores you can spare. Answers
are transcribed one or two at a time in the background, so a slow machine only
means a longer wait. Typesetting takes seconds.

### Backups

Everything lives in two volumes:

- `db`: PostgreSQL. Back it up with `docker compose exec db pg_dump -U kinstory kinstory > kinstory.sql`.
- `data`: recordings, photos and rendered books. Copy the volume's directory.

Each family can also download a complete export from **Settings → Your data**.

## Without Docker

1. Install Node.js 22.18+, PostgreSQL 14+, ffmpeg, [Typst](https://github.com/typst/typst/releases)
   and (for transcription) [whisper.cpp](https://github.com/ggml-org/whisper.cpp)
   with a model.
2. Download `kinstory-<version>.tar.gz` from the
   [latest release](https://github.com/lobojoel2003/Kinstory/releases/latest) and unpack it.
3. Install the production dependencies:

   ```bash
   npm ci --omit=dev
   ```

4. Set the environment variables from `.env.example` (at least `DATABASE_URL`,
   `PUBLIC_URL`, `ORIGIN`, `DATA_DIR`, `TYPST_BIN`, `WHISPER_BIN` and
   `WHISPER_MODEL`) and start the server:

   ```bash
   node build
   ```

Migrations run automatically at start-up. Use a process manager (systemd,
pm2) to keep it running; it shuts down gracefully on `SIGTERM`.

## Scaling out

The worker that transcribes and typesets runs inside the web process by
default. To separate them, run one process with `WORKER=false` behind your
proxy and others with `WORKER=true`. They coordinate through PostgreSQL, so
several workers never pick up the same job.
