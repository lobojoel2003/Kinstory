# syntax=docker/dockerfile:1.7
#
# Kinstory: the web app plus everything it shells out to: whisper.cpp for
# transcription, Typst for typesetting and ffmpeg for audio.
#
#   docker build -t kinstory .
#   docker build --build-arg WHISPER_MODEL=small -t kinstory:small .   # better accuracy, bigger image
#   docker build --build-arg WHISPER_MODEL=none -t kinstory:slim .     # mount your own model at /models

ARG NODE_VERSION=24
ARG WHISPER_CPP_VERSION=v1.9.5
ARG TYPST_VERSION=0.15.1
ARG WHISPER_MODEL=base

# ---- whisper.cpp ------------------------------------------------------------
FROM debian:bookworm-slim AS whisper
ARG WHISPER_CPP_VERSION
ARG WHISPER_MODEL
ARG TARGETARCH
RUN apt-get update \
	&& apt-get install -y --no-install-recommends build-essential cmake git ca-certificates curl \
	&& rm -rf /var/lib/apt/lists/*
WORKDIR /src
RUN git clone --depth 1 --branch "${WHISPER_CPP_VERSION}" https://github.com/ggml-org/whisper.cpp .
# Portable build: no -march=native. On x86-64, target AVX2 (every CPU since 2013).
RUN set -eux; \
	extra=""; \
	if [ "$TARGETARCH" = "amd64" ]; then extra="-DGGML_AVX=ON -DGGML_AVX2=ON -DGGML_FMA=ON -DGGML_F16C=ON"; fi; \
	cmake -B build -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF -DGGML_NATIVE=OFF \
		-DWHISPER_BUILD_TESTS=OFF -DWHISPER_BUILD_SERVER=OFF $extra; \
	cmake --build build -j"$(nproc)" --config Release --target whisper-cli; \
	strip build/bin/whisper-cli
RUN mkdir -p /models \
	&& if [ "$WHISPER_MODEL" != "none" ]; then bash ./models/download-ggml-model.sh "$WHISPER_MODEL" /models; fi \
	&& ls -la /models

# ---- Typst ----------------------------------------------------------------------
FROM debian:bookworm-slim AS typst
ARG TYPST_VERSION
ARG TARGETARCH
RUN apt-get update \
	&& apt-get install -y --no-install-recommends curl ca-certificates xz-utils \
	&& rm -rf /var/lib/apt/lists/*
RUN set -eux; \
	case "$TARGETARCH" in \
		amd64) triple=x86_64-unknown-linux-musl ;; \
		arm64) triple=aarch64-unknown-linux-musl ;; \
		*) echo "unsupported architecture: $TARGETARCH"; exit 1 ;; \
	esac; \
	curl -fsSL --retry 5 "https://github.com/typst/typst/releases/download/v${TYPST_VERSION}/typst-${triple}.tar.xz" | tar -xJ -C /tmp; \
	install -m 0755 "/tmp/typst-${triple}/typst" /usr/local/bin/typst; \
	typst --version

# ---- App build -------------------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG BUILD_NUMBER=docker
ARG GIT_SHA=unknown
ARG BUILD_DATE=
ENV BUILD_NUMBER=${BUILD_NUMBER} GIT_SHA=${GIT_SHA} BUILD_DATE=${BUILD_DATE}
RUN npm run build && npm prune --omit=dev --no-audit --no-fund

# ---- Runtime --------------------------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim
ARG VERSION=dev
ARG BUILD_NUMBER=docker
ARG GIT_SHA=unknown
ARG BUILD_DATE=
ARG WHISPER_MODEL
LABEL org.opencontainers.image.title="Kinstory" \
	org.opencontainers.image.description="Record a grandparent's stories by phone or voice note and print them as a book." \
	org.opencontainers.image.source="https://github.com/lobojoel2003/Kinstory" \
	org.opencontainers.image.licenses="AGPL-3.0-or-later" \
	org.opencontainers.image.version="${VERSION}" \
	org.opencontainers.image.revision="${GIT_SHA}" \
	org.opencontainers.image.created="${BUILD_DATE}" \
	dev.kinstory.build-number="${BUILD_NUMBER}"

RUN apt-get update \
	&& apt-get install -y --no-install-recommends ffmpeg libgomp1 tini ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=typst /usr/local/bin/typst /usr/local/bin/typst
COPY --from=whisper /src/build/bin/whisper-cli /usr/local/bin/whisper-cli
COPY --from=whisper /models /models
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY templates ./templates
COPY fonts ./fonts
COPY migrations ./migrations
COPY demo ./demo

ENV NODE_ENV=production \
	PORT=3000 \
	HOST=0.0.0.0 \
	DATA_DIR=/data \
	KINSTORY_ASSETS_DIR=/app \
	TYPST_BIN=/usr/local/bin/typst \
	WHISPER_BIN=/usr/local/bin/whisper-cli \
	WHISPER_MODEL=/models/ggml-${WHISPER_MODEL}.bin \
	BODY_SIZE_LIMIT=300M

RUN mkdir -p /data && chown node:node /data
USER node
VOLUME ["/data"]
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
	CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "build"]
