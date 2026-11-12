// Version and build metadata, baked in at build time. CI sets BUILD_NUMBER
// (the GitHub Actions run number) and GIT_SHA; local builds say "dev".

export const version = {
	version: __APP_VERSION__,
	build: __BUILD_NUMBER__,
	commit: __GIT_SHA__,
	date: __BUILD_DATE__,
	/** SemVer with build metadata, e.g. "1.0.0+42.3f2a9c1". */
	full: `${__APP_VERSION__}+${__BUILD_NUMBER__}.${__GIT_SHA__}`
};
