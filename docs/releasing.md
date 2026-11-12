# Releasing Kinstory

Kinstory uses [Semantic Versioning](https://semver.org): `MAJOR.MINOR.PATCH`.

- **PATCH**: bug fixes, translations, typographic refinements that don't
  change page counts much.
- **MINOR**: new features, new migrations that only add things.
- **MAJOR**: anything that needs action from people who run Kinstory, such as
  a renamed environment variable or a destructive migration.

## Cutting a release

1. Move the entries under `## [Unreleased]` in `CHANGELOG.md` to a new
   `## [X.Y.Z] - YYYY-MM-DD` section, and update the comparison links at the
   bottom.
2. Bump the version in `package.json` and `package-lock.json`:

   ```bash
   npm version X.Y.Z --no-git-tag-version
   ```

3. Check that they agree:

   ```bash
   npm run version:check
   ```

4. Commit, then tag and push:

   ```bash
   git commit -am "Release X.Y.Z"
   ```

   ```bash
   git tag -a vX.Y.Z -m "Kinstory X.Y.Z"
   ```

   ```bash
   git push origin main vX.Y.Z
   ```

Alternatively, push the commit and run the **Release** workflow from the
repository's Actions tab on `main`, entering the version (`X.Y.Z`). It does
everything below and creates the annotated `vX.Y.Z` tag itself once the
images are published. This is handy when you cannot push tags directly.

The [release workflow](../.github/workflows/release.yml) then:

1. checks that the tag, `package.json` and `CHANGELOG.md` agree;
2. runs linting, type checks, and the unit and integration tests;
3. builds the app with the run number as its build number;
4. packages `kinstory-X.Y.Z.tar.gz`, typesets the sample book and writes
   `SHA256SUMS.txt`;
5. builds the Docker image natively for `linux/amd64` and `linux/arm64`, and
   publishes `X.Y.Z`, `X.Y`, `X` and `latest` to
   `ghcr.io/lobojoel2003/kinstory`;
6. creates the GitHub release with the changelog section as its notes.

Tags with a pre-release suffix (`v1.1.0-rc.1`) are published as pre-releases
and do not move `latest`.

## Build numbers

`BUILD_NUMBER` is the GitHub Actions run number and `GIT_SHA` the commit. Both
are baked in at build time and appear:

- in the footer of every page (`v1.0.0 · build 42 · 3f2a9c1`);
- at `GET /api/health` (`"full": "1.0.0+42.3f2a9c1"`);
- in the Docker image labels (`org.opencontainers.image.version`,
  `org.opencontainers.image.revision`, `dev.kinstory.build-number`).

Local builds report the build number as `dev`.
